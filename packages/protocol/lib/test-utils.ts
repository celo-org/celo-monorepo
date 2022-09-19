import { Signature } from '@celo/base/lib/signatureUtils'
import { hasEntryInRegistry, usesRegistry } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { AttestationUtils } from '@celo/utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { soliditySha3 } from '@celo/utils/lib/solidity'
import assert from 'assert'
import BigNumber from 'bignumber.js'
import chai from 'chai'
import chaiSubset from 'chai-subset'
import { spawn, SpawnOptions } from 'child_process'
import { keccak256 } from 'ethereumjs-util'
import {
  GovernanceApproverMultiSigInstance,
  GovernanceInstance,
  LockedGoldInstance,
  ProxyInstance,
  RegistryInstance,
  UsingRegistryInstance,
} from 'types'
import Web3 from 'web3'

// tslint:disable-next-line: ordered-imports
import BN = require('bn.js')

const isNumber = (x: any) =>
  typeof x === 'number' || (BN as any).isBN(x) || BigNumber.isBigNumber(x)

chai.use(chaiSubset)

// hard coded in ganache
export const EPOCH = 100

export function stripHexEncoding(hexString: string) {
  return hexString.substr(0, 2) === '0x' ? hexString.substr(2) : hexString
}

export function assertContainSubset(superset: any, subset: any) {
  const assert2: any = chai.assert
  return assert2.containSubset(superset, subset)
}

export async function jsonRpc(web3: Web3, method: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof web3.currentProvider !== 'string') {
      web3.currentProvider.send(
        {
          jsonrpc: '2.0',
          method,
          params,
          // salt id generation, milliseconds might not be
          // enough to generate unique ids
          id: new Date().getTime() + Math.floor(Math.random() * (1 + 100 - 1)),
        },
        // @ts-ignore
        (err: any, result: any) => {
          if (err) {
            return reject(err)
          }
          return resolve(result)
        }
      )
    } else {
      reject(new Error('Invalid Provider'))
    }
  })
}

export async function timeTravel(seconds: number, web3: Web3) {
  await jsonRpc(web3, 'evm_increaseTime', [seconds])
  await jsonRpc(web3, 'evm_mine', [])
}

export async function mineBlocks(blocks: number, web3: Web3) {
  for (let i = 0; i < blocks; i++) {
    await jsonRpc(web3, 'evm_mine', [])
  }
}

export async function currentEpochNumber(web3: Web3, epochSize: number = EPOCH) {
  const blockNumber = await web3.eth.getBlockNumber()

  return getEpochNumberOfBlock(blockNumber, epochSize)
}

export function getEpochNumberOfBlock(blockNumber: number, epochSize: number = EPOCH) {
  // Follows GetEpochNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
  const epochNumber = Math.floor(blockNumber / epochSize)
  if (blockNumber % epochSize === 0) {
    return epochNumber
  } else {
    return epochNumber + 1
  }
}

// Follows GetEpochFirstBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
export function getFirstBlockNumberForEpoch(epochNumber: number, epochSize: number = EPOCH) {
  if (epochNumber === 0) {
    // No first block for epoch 0
    return 0
  }
  return (epochNumber - 1) * epochSize + 1
}

export async function mineToNextEpoch(web3: Web3, epochSize: number = EPOCH) {
  const blockNumber = await web3.eth.getBlockNumber()
  const epochNumber = await currentEpochNumber(web3, epochSize)
  const blocksUntilNextEpoch = getFirstBlockNumberForEpoch(epochNumber + 1, epochSize) - blockNumber
  await mineBlocks(blocksUntilNextEpoch, web3)
}

export async function assertBalance(address: string, balance: BigNumber) {
  const block = await web3.eth.getBlock('latest')
  const web3balance = new BigNumber(await web3.eth.getBalance(address))
  if (isSameAddress(block.miner, address)) {
    const blockReward = web3.utils.toWei(new BN(2), 'ether') as BigNumber
    assertEqualBN(web3balance, balance.plus(blockReward))
  } else {
    assertEqualBN(web3balance, balance)
  }
}

export const assertThrowsAsync = async (promise: any, errorMessage: string = '') => {
  let failed = false
  try {
    await promise
  } catch (_) {
    failed = true
  }

  assert.equal(true, failed, errorMessage)
}

export async function assertRevertWithReason(promise: any, expectedRevertReason: string = '') {
  try {
    await promise
    assert.fail('Expected transaction to revert')
  } catch (error) {
    // Only ever tested with ganache.
    // When it's a view call, error.message has a shape like:
    // `Returned error: VM Exception while processing transaction: revert ${revertMessage}`
    // When it's a transaction (eg a non-view send call), error.message has a shape like:
    // `Returned error: VM Exception while processing transaction: revert ${revertMessage} -- Reason given: ${revertMessage}.`
    // Therefore we try to parse the first instance of `${revertMessage}`.
    const foundRevertReason = error.message
      .split(' -- Reason given: ')[0]
      .split('Returned error: VM Exception while processing transaction: revert ')[1]
    assert.equal(foundRevertReason, expectedRevertReason, 'Incorrect revert message')
  }
}

// TODO: Use assertRevert directly from openzeppelin-solidity
// Note that errorMessage is not the expected revert message, but the
// message that is provided if there is no revert.
export async function assertRevert(promise: any, errorMessage: string = '') {
  try {
    await promise
    assert.fail('Expected transaction to revert')
  } catch (error) {
    const revertFound: boolean =
      error.message.search('VM Exception while processing transaction: revert') >= 0
    const msg: string =
      errorMessage === '' ? `Expected "revert", got ${error} instead` : errorMessage
    assert(revertFound, msg)
  }
}

export async function exec(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: [process.stdout, process.stderr],
    })
    proc.on('error', (error: any) => {
      reject(error)
    })
    proc.on('exit', (code: any) => {
      if (code !== 0) {
        reject(code)
      } else {
        resolve()
      }
    })
  })
}

function execCmd(cmd: string, args: string[], options?: SpawnOptions & { silent?: boolean }) {
  return new Promise<number>(async (resolve, reject) => {
    const { silent, ...spawnOptions } = options || { silent: false }
    if (!silent) {
      console.debug('$ ' + [cmd].concat(args).join(' '))
    }
    const process = spawn(cmd, args, { ...spawnOptions, stdio: silent ? 'ignore' : 'inherit' })
    process.on('close', (code) => {
      try {
        resolve(code)
      } catch (error) {
        reject(error)
      }
    })
  })
}

async function isPortOpen(host: string, port: number) {
  return (await execCmd('nc', ['-z', host, port.toString()], { silent: true })) === 0
}

export async function waitForPortOpen(host: string, port: number, seconds: number) {
  const deadline = Date.now() + seconds * 1000
  do {
    if (await isPortOpen(host, port)) {
      return true
    }
  } while (Date.now() < deadline)
  return false
}

export const assertProxiesSet = async (getContract: any) => {
  for (const contractName of proxiedContracts) {
    const contract = await getContract(contractName, 'contract')
    const proxy: ProxyInstance = await getContract(contractName, 'proxy')
    assert.equal(
      contract.address.toLowerCase(),
      (await proxy._getImplementation()).toLowerCase(),
      contractName + 'Proxy not pointing to the ' + contractName + ' implementation'
    )
  }
}

export const assertContractsRegistered = async (getContract: any) => {
  const registry: RegistryInstance = await getContract('Registry', 'proxiedContract')
  for (const contractName of hasEntryInRegistry) {
    const contract: Truffle.ContractInstance = await getContract(contractName, 'proxiedContract')
    assert.equal(
      contract.address.toLowerCase(),
      (await registry.getAddressFor(soliditySha3(contractName))).toLowerCase(),
      'Registry does not have the correct information for ' + contractName
    )
  }
}

export const assertRegistryAddressesSet = async (getContract: any) => {
  const registry: RegistryInstance = await getContract('Registry', 'proxiedContract')
  for (const contractName of usesRegistry) {
    const contract: UsingRegistryInstance = await getContract(contractName, 'proxiedContract')
    assert.equal(
      registry.address.toLowerCase(),
      (await contract.registry()).toLowerCase(),
      'Registry address is not set properly in ' + contractName
    )
  }
}

export const assertContractsOwnedByMultiSig = async (getContract: any) => {
  const multiSigAddress = (await getContract('MultiSig', 'proxiedContract')).address
  for (const contractName of ownedContracts) {
    const contractOwner: string = await (await getContract(contractName, 'proxiedContract')).owner()
    assert.equal(contractOwner, multiSigAddress, contractName + ' is not owned by the MultiSig')
  }

  for (const contractName of proxiedContracts) {
    const proxyOwner = await (await getContract(contractName, 'proxy'))._getOwner()
    assert.equal(proxyOwner, multiSigAddress, contractName + 'Proxy is not owned by the MultiSig')
  }
}

export const assertFloatEquality = (
  a: BigNumber,
  b: BigNumber,
  errorMessage: string,
  epsilon = new BigNumber(0.00000001)
) => {
  assert(a.minus(b).abs().comparedTo(epsilon) === -1, errorMessage)
}

export function assertLogMatches2(
  log: Truffle.TransactionLog,
  expected: { event: string; args: Record<string, any> }
) {
  assertLogMatches(log, expected.event, expected.args)
}

export function assertLogMatches(
  log: Truffle.TransactionLog,
  event: string,
  args: Record<string, any>
) {
  assert.equal(log.event, event, `Log event name doesn\'t match`)
  assertObjectWithBNEqual(log.args, args, (arg) => `Event ${event}, arg: ${arg} do not match`)
}

// Compares objects' properties, using assertBNEqual to compare BN fields.
// Extracted out of previous `assertLogMatches`.
export function assertObjectWithBNEqual(
  actual: object,
  expected: Record<string, any>,
  fieldErrorMsg: (field?: string) => string
) {
  const objectFields = Object.keys(actual)
    .filter((k) => k !== '__length__' && isNaN(parseInt(k, 10)))
    .sort()

  assert.deepEqual(objectFields, Object.keys(expected).sort(), `Argument names do not match`)
  for (const k of objectFields) {
    if (typeof expected[k] === 'function') {
      expected[k](actual[k], fieldErrorMsg(k))
    } else if (isNumber(actual[k]) || isNumber(expected[k])) {
      assertEqualBN(actual[k], expected[k], fieldErrorMsg(k))
    } else if (Array.isArray(actual[k])) {
      assert.deepEqual(actual[k], expected[k], fieldErrorMsg(k))
    } else {
      assert.equal(actual[k], expected[k], fieldErrorMsg(k))
    }
  }
}

export function assertEqualBN(
  actual: number | BN | BigNumber,
  expected: number | BN | BigNumber,
  msg?: string
) {
  assert(
    web3.utils.toBN(actual).eq(web3.utils.toBN(expected)),
    `expected ${expected.toString(10)} and got ${actual.toString(10)}. ${msg || ''}`
  )
}

export function assertAlmostEqualBN(
  actual: number | BN | BigNumber,
  expected: number | BN | BigNumber,
  margin: number | BN | BigNumber,
  msg?: string
) {
  const diff = web3.utils.toBN(actual).sub(web3.utils.toBN(expected)).abs()
  assert(
    web3.utils.toBN(margin).gte(diff),
    `expected ${expected.toString(10)} to be within ${margin.toString(10)} of ${actual.toString(
      10
    )}. ${msg || ''}`
  )
}

export function assertEqualDpBN(
  value: number | BN | BigNumber,
  expected: number | BN | BigNumber,
  decimals: number,
  msg?: string
) {
  const valueDp = new BigNumber(value.toString()).dp(decimals)
  const expectedDp = new BigNumber(expected.toString()).dp(decimals)
  assert(
    valueDp.isEqualTo(expectedDp),
    `expected ${expectedDp.toString()} and got ${valueDp.toString()}. ${msg || ''}`
  )
}

export function assertEqualBNArray(
  value: number[] | BN[] | BigNumber[],
  expected: number[] | BN[] | BigNumber[],
  msg?: string
) {
  assert.equal(value.length, expected.length, msg)
  value.forEach((x, i) => assertEqualBN(x, expected[i]))
}

export function assertGteBN(
  value: number | BN | BigNumber,
  expected: number | BN | BigNumber,
  msg?: string
) {
  assert(
    web3.utils.toBN(value).gte(web3.utils.toBN(expected)),
    `expected ${value.toString()} to be greater than or equal to ${expected.toString()}. ${
      msg || ''
    }`
  )
}

export const isSameAddress = (minerAddress, otherAddress) => {
  return minerAddress.toLowerCase() === otherAddress.toLowerCase()
}

// TODO(amy): Pull this list from the build artifacts instead
export const proxiedContracts: string[] = [
  'Attestations',
  // TODO ASv2 revisit if we need to update test-utils
  'Escrow',
  'GoldToken',
  'Registry',
  'Reserve',
  'SortedOracles',
  'StableToken',
]

// TODO(asa): Pull this list from the build artifacts instead
export const ownedContracts: string[] = [
  'Attestations',
  // TODO ASv2 revisit if we need to update test-utils
  'Escrow',
  'Exchange',
  'Registry',
  'Reserve',
  'SortedOracles',
  'StableToken',
]

export function getOffsetForMinerSelection(
  blockhash: string,
  index: number,
  verifierBlockWindowSize: number
): number {
  const selectedVerifierBlockOffsets = new Set()

  let hash: any = new BN(blockhash.replace('0x', ''), 16)
  let verifierBlockOffset = 0
  let currentVerification = 0
  const mod = new BN(verifierBlockWindowSize)
  while (currentVerification <= index) {
    hash = keccak256(hash)
    verifierBlockOffset = new BN(hash).mod(mod).toNumber()
    if (!selectedVerifierBlockOffsets.has(verifierBlockOffset)) {
      selectedVerifierBlockOffsets.add(verifierBlockOffset)
      currentVerification++
    }
  }

  return verifierBlockOffset
}

export const assertSameAddress = (value: string, expected: string, msg?: string) => {
  assert.equal(expected.toLowerCase(), value.toLowerCase(), msg)
}

export function createMatcher<A>(assertFn: (value: A, expected: A, msg?: string) => void) {
  return (expected: A) => (value: A, msg?: string) => {
    assertFn(value, expected, msg)
  }
}

export const matchAddress = createMatcher(assertSameAddress)

export const matchAny = () => {
  // nothing
}

export default {
  assertContainSubset,
  assertRevert,
  timeTravel,
  isSameAddress,
}

export async function addressMinedLatestBlock(address: string) {
  const block = await web3.eth.getBlock('latest')
  return isSameAddress(block.miner, address)
}

enum VoteValue {
  None = 0,
  Abstain,
  No,
  Yes,
}

export async function assumeOwnership(
  contractsToOwn: string[],
  to: string,
  proposalId: number = 1,
  dequeuedIndex: number = 0
) {
  const governance: GovernanceInstance = await getDeployedProxiedContract('Governance', artifacts)
  const lockedGold: LockedGoldInstance = await getDeployedProxiedContract('LockedGold', artifacts)
  const multiSig: GovernanceApproverMultiSigInstance = await getDeployedProxiedContract(
    'GovernanceApproverMultiSig',
    artifacts
  )
  const registry: RegistryInstance = await getDeployedProxiedContract('Registry', artifacts)
  // Enough to pass the governance proposal unilaterally (and then some).
  const tenMillionCELO = '10000000000000000000000000'
  // @ts-ignore
  await lockedGold.lock({ value: tenMillionCELO })
  // Any contract's `transferOwnership` function will work here as the function signatures are all the same.
  // @ts-ignore
  const transferOwnershipData = Buffer.from(
    stripHexEncoding(registry.contract.methods.transferOwnership(to).encodeABI()),
    'hex'
  )
  const proposalTransactions = await Promise.all(
    contractsToOwn.map(async (contractName: string) => {
      return {
        value: 0,
        destination: (await getDeployedProxiedContract(contractName, artifacts)).address,
        data: transferOwnershipData,
      }
    })
  )
  await governance.propose(
    proposalTransactions.map((tx: any) => tx.value),
    proposalTransactions.map((tx: any) => tx.destination),
    // @ts-ignore
    Buffer.concat(proposalTransactions.map((tx: any) => tx.data)),
    proposalTransactions.map((tx: any) => tx.data.length),
    'URL',
    // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
    { value: web3.utils.toWei(config.governance.minDeposit.toString(), 'ether') }
  )

  await governance.upvote(proposalId, 0, 0)
  await timeTravel(config.governance.dequeueFrequency, web3)
  // @ts-ignore
  const txData = governance.contract.methods.approve(proposalId, dequeuedIndex).encodeABI()
  await multiSig.submitTransaction(governance.address, 0, txData)
  await timeTravel(config.governance.approvalStageDuration, web3)
  await governance.vote(proposalId, dequeuedIndex, VoteValue.Yes)
  await timeTravel(config.governance.referendumStageDuration, web3)
  await governance.execute(proposalId, dequeuedIndex)
}

/*
 * Helpers for verification
 */
export enum KeyOffsets {
  VALIDATING_KEY_OFFSET,
  ATTESTING_KEY_OFFSET,
  NEW_VALIDATING_KEY_OFFSET,
  VOTING_KEY_OFFSET,
}

// Private keys of each of the 10 miners, in the same order as their addresses in 'accounts'.
export const accountPrivateKeys: string[] = [
  '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
  '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72',
  '0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1',
  '0xff12e391b79415e941a94de3bf3a9aee577aed0731e297d5cfa0b8a1e02fa1d0',
  '0x752dd9cf65e68cfaba7d60225cbdbc1f4729dd5e5507def72815ed0d8abc6249',
  '0xefb595a0178eb79a8df953f87c5148402a224cdf725e88c0146727c6aceadccd',
  '0x83c6d2cc5ddcf9711a6d59b417dc20eb48afd58d45290099e5987e3d768f328f',
  '0xbb2d3f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2',
  '0xb2fd4d29c1390b71b8795ae81196bfd60293adf99f9d32a0aff06288fcdac55f',
  '0x23cb7121166b9a2f93ae0b7c05bde02eae50d64449b2cbb42bc84e9d38d6cc89',
]

export async function getVerificationCodeSignature(
  account: string,
  issuer: string,
  identifier: string,
  accounts: string[]
): Promise<Signature> {
  const privateKey = getDerivedKey(KeyOffsets.ATTESTING_KEY_OFFSET, issuer, accounts)
  return AttestationUtils.attestToIdentifier(identifier, account, privateKey)
}

export const getDerivedKey = (offset: number, address: string, accounts: string[]) => {
  const pKey = accountPrivateKeys[accounts.indexOf(address)]
  const aKey = Buffer.from(pKey.slice(2), 'hex')
  aKey.write((aKey[0] + offset).toString(16))
  return '0x' + aKey.toString('hex')
}

export const unlockAndAuthorizeKey = async (
  offset: number,
  authorizeFn: any,
  account: string,
  accounts: string[]
) => {
  const key = getDerivedKey(offset, account, accounts)
  const addr = privateKeyToAddress(key)
  // @ts-ignore
  await web3.eth.personal.importRawKey(key, 'passphrase')
  await web3.eth.personal.unlockAccount(addr, 'passphrase', 1000000)

  const signature = await getParsedSignatureOfAddress(web3, account, addr)
  return authorizeFn(addr, signature.v, signature.r, signature.s, {
    from: account,
  })
}
