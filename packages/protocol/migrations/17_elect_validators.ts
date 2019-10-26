/* tslint:disable:no-console */
import { NULL_ADDRESS } from '@celo/protocol/lib/test-utils'
import {
  add0x,
  generateAccountAddressFromPrivateKey,
  generatePublicKeyFromPrivateKey,
  getDeployedProxiedContract,
  sendTransactionWithPrivateKey,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { blsPrivateKeyToProcessedPrivateKey } from '@celo/utils/lib/bls'
import { toFixed } from '@celo/utils/lib/fixidity'
import { BigNumber } from 'bignumber.js'
import * as bls12377js from 'bls12377js'
import { ElectionInstance, LockedGoldInstance, ValidatorsInstance } from 'types'

const Web3 = require('web3')

function serializeKeystore(keystore: any) {
  return Buffer.from(JSON.stringify(keystore)).toString('base64')
}

async function lockGold(lockedGold: LockedGoldInstance, value: BigNumber, privateKey: string) {
  // @ts-ignore
  const createAccountTx = lockedGold.contract.methods.createAccount()
  await sendTransactionWithPrivateKey(web3, createAccountTx, privateKey, {
    to: lockedGold.address,
  })

  // @ts-ignore
  const lockTx = lockedGold.contract.methods.lock()

  await sendTransactionWithPrivateKey(web3, lockTx, privateKey, {
    to: lockedGold.address,
    value,
  })
}

async function registerValidatorGroup(
  lockedGold: LockedGoldInstance,
  validators: ValidatorsInstance,
  privateKey: string
) {
  // Validators can't also be validator groups, so we create a new account to register the
  // validator group with, and set the group identifier to the private key of this account
  // encrypted with the private key of the first validator, so that the group private key
  // can be recovered.
  const account = web3.eth.accounts.create()

  // We do not use web3 provided by Truffle since the eth.accounts.encrypt behaves differently
  // in the version we use elsewhere.
  const encryptionWeb3 = new Web3('http://localhost:8545')
  const encryptedPrivateKey = encryptionWeb3.eth.accounts.encrypt(account.privateKey, privateKey)
  const encodedKey = serializeKeystore(encryptedPrivateKey)

  await web3.eth.sendTransaction({
    from: generateAccountAddressFromPrivateKey(privateKey.slice(0)),
    to: account.address,
    value: config.validators.registrationRequirements.group * 2, // Add a premium to cover tx fees
  })

  await lockGold(lockedGold, config.validators.registrationRequirements.group, account.privateKey)

  // @ts-ignore
  const tx = validators.contract.methods.registerValidatorGroup(
    `${config.validators.groupName} ${encodedKey}`,
    toFixed(config.validators.commission).toString()
  )

  await sendTransactionWithPrivateKey(web3, tx, account.privateKey, {
    to: validators.address,
  })

  return account
}

async function registerValidator(
  lockedGold: LockedGoldInstance,
  validators: ValidatorsInstance,
  validatorPrivateKey: string,
  groupAddress: string
) {
  const validatorPrivateKeyHexStripped = validatorPrivateKey.slice(2)
  const address = generateAccountAddressFromPrivateKey(validatorPrivateKeyHexStripped)
  const publicKey = generatePublicKeyFromPrivateKey(validatorPrivateKeyHexStripped)
  const blsValidatorPrivateKeyBytes = blsPrivateKeyToProcessedPrivateKey(
    validatorPrivateKeyHexStripped
  )
  const blsPublicKey = bls12377js.BLS.privateToPublicBytes(blsValidatorPrivateKeyBytes).toString(
    'hex'
  )
  const blsPoP = bls12377js.BLS.signPoP(blsValidatorPrivateKeyBytes).toString('hex')
  const publicKeysData = publicKey + blsPublicKey + blsPoP

  await lockGold(
    lockedGold,
    config.validators.registrationRequirements.validator,
    validatorPrivateKey
  )

  // @ts-ignore
  const registerTx = validators.contract.methods.registerValidator(address, add0x(publicKeysData))

  await sendTransactionWithPrivateKey(web3, registerTx, validatorPrivateKey, {
    to: validators.address,
  })

  // @ts-ignore
  const affiliateTx = validators.contract.methods.affiliate(groupAddress)

  await sendTransactionWithPrivateKey(web3, affiliateTx, validatorPrivateKey, {
    to: validators.address,
  })

  return
}

module.exports = async (_deployer: any) => {
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

  if (valKeys.length === 0) {
    console.info('  No validators to register')
    return
  }

  if (valKeys.length < config.validators.minElectableValidators) {
    console.info(
      `  Warning: Have ${valKeys.length} Validator keys but require a minimum of ${
        config.validators.minElectableValidators
      } Validators in order for a new validator set to be elected.`
    )
  }

  console.info('  Registering ValidatorGroup ...')
  const firstPrivateKey = valKeys[0]
  const account = await registerValidatorGroup(lockedGold, validators, firstPrivateKey)

  console.info('  Registering Validators ...')
  await Promise.all(
    valKeys.map((key) => registerValidator(lockedGold, validators, key, account.address))
  )

  console.info('  Adding Validators to Validator Group ...')
  for (let i = 0; i < valKeys.length; i++) {
    const key = valKeys[i]
    const address = generateAccountAddressFromPrivateKey(key.slice(2))
    if (i === 0) {
      // @ts-ignore
      const addTx = validators.contract.methods.addFirstMember(address, NULL_ADDRESS, NULL_ADDRESS)
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

  console.info('  Voting for Validator Group ...')
  // Make another deposit so our vote has more weight.
  const minLockedGoldVotePerValidator = 10000
  const value = new BigNumber(valKeys.length)
    .times(minLockedGoldVotePerValidator)
    .times(web3.utils.toWei('1'))
  // @ts-ignore
  await lockedGold.lock({ value })
  await election.vote(account.address, value, NULL_ADDRESS, NULL_ADDRESS)
}
