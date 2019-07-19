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
import { BigNumber } from 'bignumber.js'
import * as minimist from 'minimist'
import { BondedDepositsInstance, ValidatorsInstance } from 'types'

const argv = minimist(process.argv, {
  string: ['keys'],
  default: { keys: '' },
})

function serializeKeystore(keystore: any) {
  return Buffer.from(JSON.stringify(keystore)).toString('base64')
}

async function makeMinimumDeposit(bondedDeposits: BondedDepositsInstance, privateKey: string) {
  // @ts-ignore
  const createAccountTx = bondedDeposits.contract.methods.createAccount()
  await sendTransactionWithPrivateKey(web3, createAccountTx, privateKey, {
    to: bondedDeposits.address,
  })

  // @ts-ignore
  const bondTx = bondedDeposits.contract.methods.deposit(
    config.validators.minBondedDepositNoticePeriod
  )

  await sendTransactionWithPrivateKey(web3, bondTx, privateKey, {
    to: bondedDeposits.address,
    value: config.validators.minBondedDepositValue,
  })
}

async function registerValidatorGroup(
  bondedDeposits: BondedDepositsInstance,
  validators: ValidatorsInstance,
  privateKey: string
) {
  // Validators can't also be validator groups, so we create a new account to register the
  // validator group with, and set the group identifier to the private key of this account
  // encrypted with the private key of the first validator, so that the group private key
  // can be recovered.
  const account = web3.eth.accounts.create()

  const encryptedPrivateKey = web3.eth.accounts.encrypt(account.privateKey, privateKey)
  const encodedKey = serializeKeystore(encryptedPrivateKey)

  await web3.eth.sendTransaction({
    from: generateAccountAddressFromPrivateKey(privateKey.slice(0)),
    to: account.address,
    value: config.validators.minBondedDepositValue * 2, // Add a premium to cover tx fees
  })

  await makeMinimumDeposit(bondedDeposits, account.privateKey)

  // @ts-ignore
  const tx = validators.contract.methods.registerValidatorGroup(
    encodedKey,
    config.validators.groupName,
    config.validators.groupUrl,
    config.validators.minBondedDepositNoticePeriod
  )

  await sendTransactionWithPrivateKey(web3, tx, account.privateKey, {
    to: validators.address,
  })

  return account
}

async function registerValidator(
  bondedDeposits: BondedDepositsInstance,
  validators: ValidatorsInstance,
  validatorPrivateKey: string,
  groupAddress: string
) {
  const address = generateAccountAddressFromPrivateKey(validatorPrivateKey.slice(2))
  const publicKey = add0x(generatePublicKeyFromPrivateKey(validatorPrivateKey.slice(2)))

  await makeMinimumDeposit(bondedDeposits, validatorPrivateKey)

  // @ts-ignore
  const registerTx = validators.contract.methods.registerValidator(
    address,
    address,
    config.validators.groupUrl,
    publicKey,
    config.validators.minBondedDepositNoticePeriod
  )

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

  const bondedDeposits: BondedDepositsInstance = await getDeployedProxiedContract<
    BondedDepositsInstance
  >('BondedDeposits', artifacts)

  const valKeys: string[] = argv.keys ? argv.keys.split(',') : []

  if (valKeys.length === 0) {
    console.log('  No validators to register')
    return
  }

  if (valKeys.length < config.validators.minElectableValidators) {
    console.log(
      `  Warning: Have ${valKeys.length} Validator keys but require a minimum of ${
        config.validators.minElectableValidators
      } Validators in order for a new validator set to be elected.`
    )
  }

  console.info('  Registering ValidatorGroup ...')
  const firstPrivateKey = valKeys[0]
  const account = await registerValidatorGroup(bondedDeposits, validators, firstPrivateKey)

  console.info('  Registering Validators ...')
  await Promise.all(
    valKeys.map((key) => registerValidator(bondedDeposits, validators, key, account.address))
  )

  console.info('  Adding Validators to Validator Group ...')
  for (const key of valKeys) {
    const address = generateAccountAddressFromPrivateKey(key.slice(2))
    // @ts-ignore
    const addTx = validators.contract.methods.addMember(address)
    await sendTransactionWithPrivateKey(web3, addTx, account.privateKey, {
      to: validators.address,
    })
  }

  console.info('  Voting for Validator Group ...')
  // Make another deposit so our vote has more weight.
  const minBondedDepositVotePerValidator = 10000
  await bondedDeposits.deposit(0, {
    // @ts-ignore
    value: new BigNumber(valKeys.length)
      .times(minBondedDepositVotePerValidator)
      .times(config.validators.minBondedDepositValue),
  })
  await validators.vote(account.address, NULL_ADDRESS, NULL_ADDRESS)
}
