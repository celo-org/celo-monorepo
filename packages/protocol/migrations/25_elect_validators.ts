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
import Web3, * as Web3Class from 'web3'
import { TransactionObject } from 'web3-eth'

const truffle = require('@celo/protocol/truffle-config.js')
const bip39 = require('bip39')
const hdkey = require('ethereumjs-wallet/hdkey')

function ganachePrivateKey(num) {
  const seed = bip39.mnemonicToSeedSync(truffle.networks.development.mnemonic)
  const hdk = hdkey.fromMasterSeed(seed)
  const addrNode = hdk.derivePath("m/44'/60'/0'/0/" + num) // m/44'/60'/0'/0/0 is derivation path for the first account. m/44'/60'/0'/0/1 is the derivation path for the second account and so on
  return addrNode
    .getWallet()
    .getPrivateKey()
    .toString('hex')
}

function serializeKeystore(keystore: any) {
  return Buffer.from(JSON.stringify(keystore)).toString('base64')
}

let isGanache = false

// Will include Ganache private keys for accounts 7-9, used for group keys
let extraKeys = []

async function sendTransaction<T>(
  web3: Web3,
  tx: TransactionObject<T> | null,
  privateKey: string,
  txArgs: any
) {
  if (isGanache) {
    const from = privateKeyToAddress(privateKey)
    if (tx == null) {
      await web3.eth.sendTransaction({ ...txArgs, from })
    } else {
      await tx.send({ ...txArgs, from, gasLimit: '10000000' })
    }
  } else {
    await sendTransactionWithPrivateKey(web3, tx, privateKey, txArgs)
  }
}

async function lockGold(
  accounts: AccountsInstance,
  lockedGold: LockedGoldInstance,
  value: BigNumber,
  privateKey: string
) {
  // @ts-ignore
  const createAccountTx = accounts.contract.methods.createAccount()
  await sendTransaction(web3, createAccountTx, privateKey, {
    to: accounts.address,
  })

  // @ts-ignore
  const lockTx = lockedGold.contract.methods.lock()

  await sendTransaction(web3, lockTx, privateKey, {
    to: lockedGold.address,
    value: value.toString(10),
  })
}

function createAccountOrUseFromGanache() {
  if (isGanache) {
    const privateKey = extraKeys.pop()
    return { address: privateKeyToAddress(privateKey), privateKey }
  } else {
    return web3.eth.accounts.create()
  }
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
  const account = createAccountOrUseFromGanache()

  // We do not use web3 provided by Truffle since the eth.accounts.encrypt behaves differently
  // in the version we use elsewhere.
  const encryptionWeb3 = new (Web3Class as any)('http://localhost:8545')
  const encryptedPrivateKey = encryptionWeb3.eth.accounts.encrypt(account.privateKey, privateKey)
  const encodedKey = serializeKeystore(encryptedPrivateKey)

  // Add a premium to cover tx fees
  const v = lockedGoldValue.times(1.01).integerValue()

  console.info(`    - send funds ${v} to group address ${account.address}`)
  await sendTransaction(web3, null, privateKey, {
    to: account.address,
    value: v,
  })

  console.info(`    - lock gold`)
  await lockGold(accounts, lockedGold, lockedGoldValue, account.privateKey)

  console.info(`    - setName`)
  // @ts-ignore
  const setNameTx = accounts.contract.methods.setName(`${name} ${encodedKey}`)
  await sendTransaction(web3, setNameTx, account.privateKey, {
    to: accounts.address,
  })

  console.info(`    - registerValidatorGroup`)
  // @ts-ignore
  const tx = validators.contract.methods.registerValidatorGroup(
    toFixed(config.validators.commission).toString()
  )

  await sendTransaction(web3, tx, account.privateKey, {
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
  await sendTransaction(web3, setNameTx, validatorPrivateKey, {
    to: accounts.address,
  })

  console.info(`    - registerValidator ${valName}`)
  const publicKey = privateKeyToPublicKey(validatorPrivateKey)
  const blsPublicKey = getBlsPublicKey(validatorPrivateKey)
  const blsPoP = getBlsPoP(privateKeyToAddress(validatorPrivateKey), validatorPrivateKey)

  // @ts-ignore
  const registerTx = validators.contract.methods.registerValidator(publicKey, blsPublicKey, blsPoP)

  await sendTransaction(web3, registerTx, validatorPrivateKey, {
    to: validators.address,
  })

  console.info(`    - affiliate ${valName}`)

  // @ts-ignore
  const affiliateTx = validators.contract.methods.affiliate(groupAddress)

  await sendTransaction(web3, affiliateTx, validatorPrivateKey, {
    to: validators.address,
  })

  console.info(`    - setAccountDataEncryptionKey ${valName}`)

  // @ts-ignore
  const registerDataEncryptionKeyTx = accounts.contract.methods.setAccountDataEncryptionKey(
    privateKeyToPublicKey(validatorPrivateKey)
  )

  await sendTransaction(web3, registerDataEncryptionKeyTx, validatorPrivateKey, {
    to: accounts.address,
  })

  if (!isGanache) {
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

    await sendTransaction(web3, registerAttestationKeyTx, validatorPrivateKey, {
      to: accounts.address,
    })
  }

  console.info(`    - done ${valName}`)
  return
}

module.exports = async (_deployer: any, networkName: string) => {
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

  if (networkName === 'development') {
    isGanache = true
    const addr0 = privateKeyToAddress('0x' + ganachePrivateKey(0))
    for (let i = 10; i < 36; i++) {
      const key = '0x' + ganachePrivateKey(i)
      const addr = privateKeyToAddress(key)
      // @ts-ignore
      await web3.eth.personal.importRawKey(key, 'passphrase')
      await web3.eth.personal.unlockAccount(addr, 'passphrase', 1000000)
      await web3.eth.sendTransaction({ from: addr0, to: addr, value: new BigNumber(11000e18) })
    }
    config.validators.validatorKeys = [...Array(30)].map((_, i) => ganachePrivateKey(i))
    extraKeys = [...Array(6)].map((_, i) => ganachePrivateKey(i + 30))
    config.validators.attestationKeys = config.validators.validatorKeys
  }

  const valKeys: string[] = config.validators.validatorKeys
  const attestationKeys: string[] = config.validators.attestationKeys

  if (valKeys.length === 0) {
    console.info('  No validators to register')
    return
  }

  if (config.validators.votesRatioOfLastVsFirstGroup < 1) {
    throw new Error(`votesRatioOfLastVsFirstGroup needs to be >= 1`)
  }

  // Assumptions about where funds are located:
  // * Validator 0 holds funds for all groups' stakes
  // * Validator 1-n holds funds needed for their own stake
  const validator0Key = valKeys[0]

  if (valKeys.length < parseInt(config.election.minElectableValidators, 10)) {
    console.info(
      `  Warning: Have ${valKeys.length} Validator keys but require a minimum of ${config.election.minElectableValidators} Validators in order for a new validator set to be elected.`
    )
  }

  // Split the validator keys into groups that will fit within the max group size.
  const valKeyGroups: string[][] = []
  const maxGroupSize: number = Number(config.validators.maxGroupSize)
  for (let i = 0; i < valKeys.length; i += maxGroupSize) {
    valKeyGroups.push(valKeys.slice(i, Math.min(i + maxGroupSize, valKeys.length)))
  }

  // Calculate per validator locked gold for first group...
  const lockedGoldPerValAtFirstGroup = new BigNumber(
    config.validators.groupLockedGoldRequirements.value
  )
  // ...and the delta for each subsequent group
  const lockedGoldPerValEachGroup = new BigNumber(
    config.validators.votesRatioOfLastVsFirstGroup - 1
  )
    .times(lockedGoldPerValAtFirstGroup)
    .div(Math.max(valKeyGroups.length - 1, 1))
    .integerValue()

  const groups = valKeyGroups.map((keys, i) => {
    const lockedGoldAmount = lockedGoldPerValAtFirstGroup
      .plus(lockedGoldPerValEachGroup.times(i))
      .times(keys.length)
    return {
      valKeys: keys,
      name: valKeyGroups.length
        ? config.validators.groupName + `(${i + 1})`
        : config.validators.groupName,
      lockedGold: lockedGoldAmount,
      voteAmount:
        i === 0 || i === valKeyGroups.length - 1
          ? lockedGoldAmount
          : new BigNumber(config.validators.groupLockedGoldRequirements.value),
      account: null,
    }
  })

  for (const [idx, group] of groups.entries()) {
    console.info(
      `  Registering validator group: ${group.name} with: ${group.lockedGold} CG locked...`
    )
    group.account = await registerValidatorGroup(
      group.name,
      accounts,
      lockedGold,
      validators,
      validator0Key,
      group.lockedGold
    )

    console.info(`  * Registering ${group.valKeys.length} validators ...`)
    await Promise.all(
      group.valKeys.map((key, i) => {
        const index = idx * config.validators.maxGroupSize + i
        return registerValidator(
          accounts,
          lockedGold,
          validators,
          key,
          attestationKeys[index],
          group.account.address,
          index,
          networkName
        )
      })
    )

    console.info(`  * Adding Validators to ${group.name} ...`)
    for (const [i, key] of group.valKeys.entries()) {
      const address = privateKeyToAddress(key)
      console.info(`    - Adding ${address} ...`)
      if (i === 0) {
        const groupsWithVotes = groups.slice(0, idx)
        groupsWithVotes.sort((a, b) => a.voteAmount.comparedTo(b.voteAmount))

        // @ts-ignore
        const addTx = validators.contract.methods.addFirstMember(
          address,
          NULL_ADDRESS,
          groupsWithVotes.length ? groupsWithVotes[0].account.address : NULL_ADDRESS
        )
        await sendTransaction(web3, addTx, group.account.privateKey, {
          to: validators.address,
        })
      } else {
        // @ts-ignore
        const addTx = validators.contract.methods.addMember(address)
        await sendTransaction(web3, addTx, group.account.privateKey, {
          to: validators.address,
        })
      }
    }

    // Determine the lesser and greater group addresses after voting.
    const sortedGroups = groups.slice(0, idx + 1)
    sortedGroups.sort((a, b) => a.voteAmount.comparedTo(b.voteAmount))
    const groupSortedIndex = sortedGroups.indexOf(group)
    const lesser =
      groupSortedIndex > 0 ? sortedGroups[groupSortedIndex - 1].account.address : NULL_ADDRESS
    const greater =
      groupSortedIndex < idx ? sortedGroups[groupSortedIndex + 1].account.address : NULL_ADDRESS

    // Note: Only the groups vote for themselves here. The validators do not vote.
    console.info('  * Group voting for itself ...')

    // Make first and last group high votes so we can maintain presence.
    const voteAmount = '0x' + group.voteAmount.toString(16)

    // @ts-ignore
    const voteTx = election.contract.methods.vote(
      group.account.address,
      voteAmount,
      lesser,
      greater
    )
    await sendTransaction(web3, voteTx, group.account.privateKey, {
      to: election.address,
    })
  }
}
