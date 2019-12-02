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
  lockedGoldValue: BigNumber
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

  // Add a premium to cover tx fees
  const v = lockedGoldValue.times(1.01).toFixed()

  console.info(`    - send funds ${v} to group address ${account.address}`)
  await sendTransactionWithPrivateKey(web3, null, privateKey, {
    to: account.address,
    value: v,
  })

  console.info(`    - lock gold`)
  await lockGold(accounts, lockedGold, lockedGoldValue, account.privateKey)

  console.info(`    - setName`)
  // @ts-ignore
  const setNameTx = accounts.contract.methods.setName(`${name} ${encodedKey}`)
  await sendTransactionWithPrivateKey(web3, setNameTx, account.privateKey, {
    to: accounts.address,
  })

  console.info(`    - registerValidatorGroup`)
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
  const valName = `CLabs Validator #${index} on ${networkName}`

  console.info(`    - lockGold ${valName}`)
  await lockGold(
    accounts,
    lockedGold,
    config.validators.validatorLockedGoldRequirements.value,
    validatorPrivateKey
  )

  console.info(`    - setName ${valName}`)

  // @ts-ignore
  const setNameTx = accounts.contract.methods.setName(valName)
  await sendTransactionWithPrivateKey(web3, setNameTx, validatorPrivateKey, {
    to: accounts.address,
  })

  console.info(`    - registerValidator ${valName}`)
  const publicKey = privateKeyToPublicKey(validatorPrivateKey)
  const blsPublicKey = getBlsPublicKey(validatorPrivateKey)
  const blsPoP = getBlsPoP(privateKeyToAddress(validatorPrivateKey), validatorPrivateKey)

  // @ts-ignore
  const registerTx = validators.contract.methods.registerValidator(publicKey, blsPublicKey, blsPoP)

  await sendTransactionWithPrivateKey(web3, registerTx, validatorPrivateKey, {
    to: validators.address,
  })

  console.info(`    - affiliate ${valName}`)

  // @ts-ignore
  const affiliateTx = validators.contract.methods.affiliate(groupAddress)

  await sendTransactionWithPrivateKey(web3, affiliateTx, validatorPrivateKey, {
    to: validators.address,
  })

  console.info(`    - setAccountDataEncryptionKey ${valName}`)

  // @ts-ignore
  const registerDataEncryptionKeyTx = accounts.contract.methods.setAccountDataEncryptionKey(
    privateKeyToPublicKey(validatorPrivateKey)
  )

  await sendTransactionWithPrivateKey(web3, registerDataEncryptionKeyTx, validatorPrivateKey, {
    to: accounts.address,
  })

  // Authorize the attestation signer
  const attestationKeyAddress = privateKeyToAddress(attestationKey)
  console.info(`    - authorizeAttestationSigner ${valName}->${attestationKeyAddress}`)
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

  console.info(`    - done ${valName}`)
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

  // Assumptions about where funds are located:
  // * Validator 0 holds funds for all groups' stakes
  // * Validator 1-n holds funds needed for their own stake
  const validator0Key = valKeys[0]

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

  if (valKeyGroups.length < 1) {
    return
  }

  if (config.validators.votesRatioOfLastVsFirstGroup < 1) {
    throw new Error(`votesRatioOfLastVsFirstGroup needs to be >= 1`)
  }

  // Calculate per validator locked gold for first group...
  const lockedGoldPerValAtFirstGroup = new BigNumber(
    config.validators.groupLockedGoldRequirements.value
  )
  // ...and the delta for each subsequent group
  let lockedGoldPerValEachGroup = new BigNumber(0)
  if (valKeyGroups.length > 1) {
    lockedGoldPerValEachGroup = new BigNumber(config.validators.votesRatioOfLastVsFirstGroup - 1)
      .times(lockedGoldPerValAtFirstGroup)
      .div(valKeyGroups.length - 1)
      .integerValue()
  }

  let prevGroupAddress = NULL_ADDRESS
  for (const [idx, groupKeys] of valKeyGroups.entries()) {
    // Append an index to the group name if there is more than one group.
    let groupName: string = config.validators.groupName
    if (valKeyGroups.length > 1) {
      groupName += ` (${idx + 1})`
    }

    // Calculate the LockedGold at this group
    const groupLockedGoldValue = new BigNumber(lockedGoldPerValAtFirstGroup)
      .plus(lockedGoldPerValEachGroup.times(idx))
      .times(groupKeys.length)

    console.info(
      `  Registering validator group: ${groupName} with: ${groupLockedGoldValue} CG locked...`
    )
    const groupAccount = await registerValidatorGroup(
      groupName,
      accounts,
      lockedGold,
      validators,
      validator0Key,
      groupLockedGoldValue
    )

    console.info(`  * Registering ${groupKeys.length} validators ...`)
    await Promise.all(
      groupKeys.map((key, i) => {
        const index = idx * config.validators.maxGroupSize + i
        return registerValidator(
          accounts,
          lockedGold,
          validators,
          key,
          attestationKeys[index],
          groupAccount.address,
          index,
          networkName
        )
      })
    )

    console.info(`  * Adding Validators to ${groupName} ...`)
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
        await sendTransactionWithPrivateKey(web3, addTx, groupAccount.privateKey, {
          to: validators.address,
        })
      } else {
        // @ts-ignore
        const addTx = validators.contract.methods.addMember(address)
        await sendTransactionWithPrivateKey(web3, addTx, groupAccount.privateKey, {
          to: validators.address,
        })
      }
    }

    // NB: Only the groups vote for themselves here. The validators do not vote.
    console.info('  * Group voting for itself ...')
    // @ts-ignore
    const voteTx = election.contract.methods.vote(
      groupAccount.address,
      '0x' + groupLockedGoldValue.toString(16),
      NULL_ADDRESS,
      prevGroupAddress
    )
    await sendTransactionWithPrivateKey(web3, voteTx, groupAccount.privateKey, {
      to: election.address,
    })

    prevGroupAddress = groupAccount.address
  }
}
