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
  const v = lockedGoldValue.times(1.01).integerValue()

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

  const validatorAddress = privateKeyToPublicKey(validatorPrivateKey)
  if (new BigNumber(await lockedGold.getAccountTotalLockedGold(validatorAddress)).isZero()) {
    console.info(`    - lockGold ${valName}`)
    await lockGold(
      accounts,
      lockedGold,
      config.validators.validatorLockedGoldRequirements.value,
      validatorPrivateKey
    )
  }

  if ((await accounts.getName(validatorAddress)) === '') {
    console.info(`    - setName ${valName}`)
    // @ts-ignore
    const setNameTx = accounts.contract.methods.setName(valName)
    await sendTransactionWithPrivateKey(web3, setNameTx, validatorPrivateKey, {
      to: accounts.address,
    })
  }

  if (!(await validators.isValidator(validatorAddress))) {
    console.info(`    - registerValidator ${valName}`)
    const publicKey = privateKeyToPublicKey(validatorPrivateKey)
    const blsPublicKey = getBlsPublicKey(validatorPrivateKey)
    const blsPoP = getBlsPoP(privateKeyToAddress(validatorPrivateKey), validatorPrivateKey)

    // @ts-ignore
    const registerTx = validators.contract.methods.registerValidator(
      publicKey,
      blsPublicKey,
      blsPoP
    )

    await sendTransactionWithPrivateKey(web3, registerTx, validatorPrivateKey, {
      to: validators.address,
    })

    console.info(`    - affiliate ${valName}`)
    // @ts-ignore
    const affiliateTx = validators.contract.methods.affiliate(groupAddress)

    await sendTransactionWithPrivateKey(web3, affiliateTx, validatorPrivateKey, {
      to: validators.address,
    })
  }

  if ((await accounts.getDataEncryptionKey(validatorAddress)) === '') {
    console.info(`    - setAccountDataEncryptionKey ${valName}`)

    // @ts-ignore
    const registerDataEncryptionKeyTx = accounts.contract.methods.setAccountDataEncryptionKey(
      privateKeyToPublicKey(validatorPrivateKey)
    )

    await sendTransactionWithPrivateKey(web3, registerDataEncryptionKeyTx, validatorPrivateKey, {
      to: accounts.address,
    })
  }

  const attestationKeyAddress = privateKeyToAddress(attestationKey)
  if (
    (await accounts.getAttestationSigner(validatorAddress)).toLowerCase() !=
    attestationKeyAddress.toLowerCase()
  ) {
    // Authorize the attestation signer
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
  }

  console.info(`    - done ${valName}`)
  return
}

const getValidatorGroupAccount = async (
  groupAddress: string,
  accounts: any,
  encryptionKey: string
) => {
  const name = await accounts.methods.getName(groupAddress).call()
  const encryptedKeystore64 = name.split(' ')[1]
  const encryptedKeystore = JSON.parse(Buffer.from(encryptedKeystore64, 'base64').toString())
  return web3.eth.accounts.decrypt(encryptedKeystore, encryptionKey)
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

  const lockedGoldPerVal = new BigNumber(config.validators.groupLockedGoldRequirements.value)

  const groups = valKeyGroups.map((keys, i) => ({
    valKeys: keys,
    name: valKeyGroups.length
      ? config.validators.groupName + `(${i + 1})`
      : config.validators.groupName,
    // Make first and last group high votes so we can maintain presence.
    lockedGold: lockedGoldPerVal.times(keys.length),
    votingGold:
      i === 0 || i === valKeyGroups.length - 1
        ? lockedGoldPerVal.times(keys.length)
        : lockedGoldPerVal,
    desiredVotingGold:
      i === 0 || i === valKeyGroups.length - 1
        ? lockedGoldPerVal.times(keys.length)
        : lockedGoldPerVal,
    account: null,
    account: null,
  }))
  groups[0].account = {
    address: '0x59D2271F8916A46810fadB3999F39215e5E65Cbc',
  }
  groups[0].votingGold = new BigNumber('110000000000000000000000')

  groups[1].account = {
    address: '0xCF0AF81CEA34B02d8f76a8eD81D5C4aAD4946E3d',
  }
  groups[1].votingGold = new BigNumber('0')

  groups[2].account = {
    address: '0x1f0CbEA9aCbECADe1f538C1Aafcb609E913D2aAb',
  }
  groups[2].votingGold = new BigNumber('0')

  groups[3].account = {
    address: '0x84F75628a787a390E03c3f1E45bf7e2BB0D211E3',
  }
  groups[3].votingGold = new BigNumber('0')

  groups[4].account = {
    address: '0xee65707aD00F5f335ae56a0E3d7bEBB1303F061A',
  }
  groups[4].votingGold = new BigNumber('10000000000000000000000')

  groups[5].account = {
    address: '0xE70a7D2b31b314F520a84d94Eb5A5d2A9B40987f',
  }
  groups[5].votingGold = new BigNumber('10000000000000000000000')

  groups[6].account = {
    address: '0x60F5fa58A4B6a9a3aFeafF7F01bCD92Ee1C9896D',
  }
  groups[6].votingGold = new BigNumber('10000000000000000000000')

  groups[7].account = {
    address: '0x2cABAdab281d6F00f71d007881153Ad3F21E6863',
  }
  groups[7].votingGold = new BigNumber('10000000000000000000000')

  groups[8].account = {
    address: '0xecc08E02771a5179925b7C0422550BffCeF3F6BA',
  }
  groups[8].votingGold = new BigNumber('10000000000000000000000')

  groups[9].account = {
    address: '0xD93C39C4E9BA65e158d1E5711CEFCD3375a85EB2',
  }
  groups[9].votingGold = new BigNumber('10000000000000000000000')

  groups[10].account = {
    address: '0x679136d0AFfe19A1642B6aB6e478dBF28D783373',
  }
  groups[10].votingGold = new BigNumber('10000000000000000000000')

  groups[11].account = {
    address: '0x6c93A7d292eCf3ca2DA8df004Ada8bD743E6D0F2',
  }
  groups[11].votingGold = new BigNumber('0')

  groups[12].account = {
    address: '0xB92629423Fb271A2e3027326aCE8BC2e4720f378',
  }
  groups[12].votingGold = new BigNumber('0')
  groups[13].account = {
    address: '0x976D3F25709f3F8eC74eA97693F505610F25e678',
  }
  groups[13].votingGold = new BigNumber('0')

  for (const [idx, group] of groups.entries()) {
    if (false) {
      console.info(
        `  Registering validator group: ${group.name} with: ${group.lockedGold} CG locked, ${
          group.votingGold
        } voting...`
      )
      group.account = await registerValidatorGroup(
        group.name,
        accounts,
        lockedGold,
        validators,
        validator0Key,
        group.lockedGold
      )
    } else {
      group.account = await getValidatorGroupAccount(group.account.address, accounts, validator0Key)
    }

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
    const numMembersAlready = parseInt(
      await validators.getGroupNumMembers(group.account.address),
      10
    )
    for (const [i, key] of group.valKeys.entries()) {
      if (i < numMembersAlready) {
        continue
      }
      const address = privateKeyToAddress(key)
      console.info(`    - Adding ${address} ...`)
      if (i === 0) {
        const groupsWithVotes = groups.slice(0, idx)
        groupsWithVotes.sort((a, b) => a.votingGold.comparedTo(b.votingGold))

        // @ts-ignore
        const addTx = validators.contract.methods.addFirstMember(
          address,
          NULL_ADDRESS,
          groupsWithVotes.length ? groupsWithVotes[0].account.address : NULL_ADDRESS
        )
        await sendTransactionWithPrivateKey(web3, addTx, group.account.privateKey, {
          to: validators.address,
        })
      } else {
        // @ts-ignore
        const addTx = validators.contract.methods.addMember(address)
        await sendTransactionWithPrivateKey(web3, addTx, group.account.privateKey, {
          to: validators.address,
        })
      }
    }

    // Determine the lesser and greater group addresses after voting.
    groups[idx].votingGold = groups[idx].desiredVotingGold
    const sortedGroups = groups.slice(0, idx + 1)
    sortedGroups.sort((a, b) => a.votingGold.comparedTo(b.votingGold))
    const groupSortedIndex = sortedGroups.indexOf(group)
    const lesser =
      groupSortedIndex > 0 ? sortedGroups[groupSortedIndex - 1].account.address : NULL_ADDRESS
    const greater =
      groupSortedIndex < idx ? sortedGroups[groupSortedIndex + 1].account.address : NULL_ADDRESS

    // Note: Only the groups vote for themselves here. The validators do not vote.
    console.info('  * Group voting for itself ...', lesser, greater, sortedGroups, groupSortedIndex)
    // @ts-ignore
    const voteTx = election.contract.methods.vote(
      group.account.address,
      '0x' + group.votingGold.toString(16),
      lesser,
      greater
    )
    await sendTransactionWithPrivateKey(web3, voteTx, group.account.privateKey, {
      to: election.address,
    })
  }
}
