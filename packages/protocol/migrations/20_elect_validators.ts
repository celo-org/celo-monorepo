/* tslint:disable:no-console */
import { NULL_ADDRESS } from '@celo/protocol/lib/test-utils'
import {
  getDeployedProxiedContract,
  sendTransactionWithPrivateKey,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { privateKeyToAddress, privateKeyToPublicKey } from '@celo/utils/lib/address'
import { getBlsPoP, getBlsPublicKey } from '@celo/utils/lib/bls'
import { toFixed } from '@celo/utils/lib/fixidity'
import { signMessage } from '@celo/utils/lib/signatureUtils'
import { BigNumber } from 'bignumber.js'
import { AccountsInstance, ElectionInstance, LockedGoldInstance, ValidatorsInstance } from 'types'

const Web3 = require('web3')

function serializeKeystore(keystore: any) {
  return Buffer.from(JSON.stringify(keystore)).toString('base64')
}

async function lockGold(
  accounts: AccountsInstance,
  lockedGold: LockedGoldInstance,
  value: BigNumber,
  privateKey: string
) {
  // @ts-ignore
  const createAccountTx = accounts.contract.methods.createAccount()
  await sendTransactionWithPrivateKey(web3, createAccountTx, privateKey, {
    to: accounts.address,
  })

  // @ts-ignore
  const lockTx = lockedGold.contract.methods.lock()

  await sendTransactionWithPrivateKey(web3, lockTx, privateKey, {
    to: lockedGold.address,
    value,
  })
}

async function registerValidatorGroup(
  name: string,
  accounts: AccountsInstance,
  lockedGold: LockedGoldInstance,
  validators: ValidatorsInstance,
  privateKey: string,
  numMembers: number
) {
  // Validators can't also be validator groups, so we create a new account to register the
  // validator group with, and set the name of the group account to the private key of this account
  // encrypted with the private key of the first validator, so that the group private key
  // can be recovered.
  const account = web3.eth.accounts.create()

  // We do not use web3 provided by Truffle since the eth.accounts.encrypt behaves differently
  // in the version we use elsewhere.
  const encryptionWeb3 = new Web3('http://localhost:8545')
  const encryptedPrivateKey = encryptionWeb3.eth.accounts.encrypt(account.privateKey, privateKey)
  const encodedKey = serializeKeystore(encryptedPrivateKey)

  // Value is per-validator.
  const lockedGoldValue = new BigNumber(config.validators.groupLockedGoldRequirements.value).times(
    numMembers
  )

  await sendTransactionWithPrivateKey(web3, null, privateKey, {
    to: account.address,
    value: lockedGoldValue.times(1.01).toFixed(), // Add a premium to cover tx fees
  })

  await lockGold(accounts, lockedGold, lockedGoldValue, account.privateKey)

  // @ts-ignore
  const setNameTx = accounts.contract.methods.setName(`${name} ${encodedKey}`)
  await sendTransactionWithPrivateKey(web3, setNameTx, account.privateKey, {
    to: accounts.address,
  })

  // @ts-ignore
  const tx = validators.contract.methods.registerValidatorGroup(
    toFixed(config.validators.commission).toString()
  )

  await sendTransactionWithPrivateKey(web3, tx, account.privateKey, {
    to: validators.address,
  })

  return account
}

async function registerValidator(
  accounts: AccountsInstance,
  lockedGold: LockedGoldInstance,
  validators: ValidatorsInstance,
  validatorPrivateKey: string,
  attestationKey: string,
  groupAddress: string,
  index: number,
  networkName: string
) {
  await lockGold(
    accounts,
    lockedGold,
    config.validators.validatorLockedGoldRequirements.value,
    validatorPrivateKey
  )

  // @ts-ignore
  const setNameTx = accounts.contract.methods.setName(`CLabs Validator #${index} on ${networkName}`)
  await sendTransactionWithPrivateKey(web3, setNameTx, validatorPrivateKey, {
    to: accounts.address,
  })

  const publicKey = privateKeyToPublicKey(validatorPrivateKey)
  const blsPublicKey = getBlsPublicKey(validatorPrivateKey)
  const blsPoP = getBlsPoP(privateKeyToAddress(validatorPrivateKey), validatorPrivateKey)

  // @ts-ignore
  const registerTx = validators.contract.methods.registerValidator(publicKey, blsPublicKey, blsPoP)

  await sendTransactionWithPrivateKey(web3, registerTx, validatorPrivateKey, {
    to: validators.address,
  })

  // @ts-ignore
  const affiliateTx = validators.contract.methods.affiliate(groupAddress)

  await sendTransactionWithPrivateKey(web3, affiliateTx, validatorPrivateKey, {
    to: validators.address,
  })

  // @ts-ignore
  const registerDataEncryptionKeyTx = accounts.contract.methods.setAccountDataEncryptionKey(
    privateKeyToPublicKey(validatorPrivateKey)
  )

  await sendTransactionWithPrivateKey(web3, registerDataEncryptionKeyTx, validatorPrivateKey, {
    to: accounts.address,
  })

  // Authorize the attestation signer
  const attestationKeyAddress = privateKeyToAddress(attestationKey)
  const message = web3.utils.soliditySha3({
    type: 'address',
    value: privateKeyToAddress(validatorPrivateKey),
  })
  const signature = signMessage(message, attestationKey, attestationKeyAddress)

  // @ts-ignore
  const registerAttestationKeyTx = accounts.contract.methods.authorizeAttestationSigner(
    attestationKeyAddress,
    signature.v,
    signature.r,
    signature.s
  )

  await sendTransactionWithPrivateKey(web3, registerAttestationKeyTx, validatorPrivateKey, {
    to: accounts.address,
  })

  return
}

module.exports = async (_deployer: any, networkName: string) => {
  if (networkName === 'development') {
    return
  }

  const accounts: AccountsInstance = await getDeployedProxiedContract<AccountsInstance>(
    'Accounts',
    artifacts
  )

  const validators: ValidatorsInstance = await getDeployedProxiedContract<ValidatorsInstance>(
    'Validators',
    artifacts
  )

  const lockedGold: LockedGoldInstance = await getDeployedProxiedContract<LockedGoldInstance>(
    'LockedGold',
    artifacts
  )

  const election: ElectionInstance = await getDeployedProxiedContract<ElectionInstance>(
    'Election',
    artifacts
  )

  const valKeys: string[] = config.validators.validatorKeys
  const attestationKeys: string[] = config.validators.attestationKeys

  if (valKeys.length === 0) {
    console.info('  No validators to register')
    return
  }

  if (valKeys.length < config.validators.minElectableValidators) {
    console.warn(
      `  Warning: Have ${valKeys.length} Validator keys but require a minimum of ${
        config.validators.minElectableValidators
      } Validators in order for a new validator set to be elected.`
    )
  }

  // Split the validator keys into groups that will fit within the max group size.
  const valKeyGroups: string[][] = []
  const maxGroupSize: number = Number(config.validators.maxGroupSize)
  for (let i = 0; i < valKeys.length; i += maxGroupSize) {
    valKeyGroups.push(valKeys.slice(i, Math.min(i + maxGroupSize, valKeys.length)))
  }

  let prevGroupAddress = NULL_ADDRESS
  for (const [idx, groupKeys] of valKeyGroups.entries()) {
    // Append an index to the group name if there is more than one group.
    let groupName: string = config.validators.groupName
    if (valKeyGroups.length > 1) {
      groupName += ` (${idx + 1})`
    }

    console.info(`  Registering validator group: ${groupName} ...`)
    const account = await registerValidatorGroup(
      groupName,
      accounts,
      lockedGold,
      validators,
      groupKeys[0],
      groupKeys.length
    )

    console.info(`  * Registering ${groupKeys.length} validators ...`)
    await Promise.all(
      groupKeys.map((key, index) =>
        registerValidator(
          accounts,
          lockedGold,
          validators,
          key,
          attestationKeys[index],
          account.address,
          index,
          networkName
        )
      )
    )

    console.info('  * Adding Validators to Validator Group ...')
    for (const [i, key] of groupKeys.entries()) {
      const address = privateKeyToAddress(key)
      console.info(`    - Adding ${address} ...`)
      if (i === 0) {
        // @ts-ignore
        const addTx = validators.contract.methods.addFirstMember(
          address,
          NULL_ADDRESS,
          prevGroupAddress
        )
        await sendTransactionWithPrivateKey(web3, addTx, account.privateKey, {
          to: validators.address,
        })
      } else {
        // @ts-ignore
        const addTx = validators.contract.methods.addMember(address)
        await sendTransactionWithPrivateKey(web3, addTx, account.privateKey, {
          to: validators.address,
        })
      }
    }

    console.info('  * Voting for the group ...')
    // Make another deposit so our vote has more weight.
    const minLockedGoldVotePerValidator = 10000
    const value = new BigNumber(groupKeys.length)
      .times(minLockedGoldVotePerValidator)
      .times(web3.utils.toWei('1'))
    // @ts-ignore
    const bondTx = lockedGold.contract.methods.lock()
    await sendTransactionWithPrivateKey(web3, bondTx, groupKeys[0], {
      to: lockedGold.address,
      value,
    })

    // @ts-ignore
    const voteTx = election.contract.methods.vote(
      account.address,
      '0x' + value.toString(16),
      NULL_ADDRESS,
      prevGroupAddress
    )
    await sendTransactionWithPrivateKey(web3, voteTx, groupKeys[0], {
      to: election.address,
    })
    prevGroupAddress = account.address
  }
}
