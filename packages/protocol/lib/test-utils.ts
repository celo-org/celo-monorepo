import { hasEntryInRegistry, usesRegistry } from '@celo/protocol/lib/registry-utils'
import BigNumber from 'bignumber.js'
import * as chai from 'chai'
import * as chaiSubset from 'chai-subset'
import { spawn, SpawnOptions } from 'child_process'
import { keccak256 } from 'ethereumjs-util'
import {
  ProxyInstance,
  RegistryInstance,
  UsingRegistryInstance,
} from 'types'
const soliditySha3 = new (require('web3'))().utils.soliditySha3

// tslint:disable-next-line: ordered-imports
import BN = require('bn.js')
import Web3 from 'web3'

const isNumber = (x: any) =>
  typeof x === 'number' || (BN as any).isBN(x) || BigNumber.isBigNumber(x)

chai.use(chaiSubset)

const assert = chai.assert

// hard coded in ganache
export const EPOCH = 100
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

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
          id: new Date().getTime() + Math.floor(Math.random() * ( 1 + 100 - 1 )),
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

export async function currentEpochNumber(web3) {
  const blockNumber = await web3.eth.getBlockNumber()
  // Follows GetEpochNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
  const epochNumber = Math.floor(blockNumber / EPOCH)
  if (blockNumber % EPOCH === 0) {
    return epochNumber
  } else {
    return epochNumber + 1
  }
}

// Follows GetEpochFirstBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
export function getFirstBlockNumberForEpoch(epochNumber: number) {
  if (epochNumber === 0) {
    // No first block for epoch 0
    return 0
  }
  return (epochNumber - 1) * EPOCH + 1
}

export async function mineToNextEpoch(web3) {
  const blockNumber = await web3.eth.getBlockNumber()
  const epochNumber = await currentEpochNumber(web3)
  const blocksUntilNextEpoch = getFirstBlockNumberForEpoch(epochNumber + 1) - blockNumber
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

// TODO: Use assertRevert directly from openzeppelin-solidity
export async function assertRevert(promise: any, errorMessage: string = '') {
  try {
    await promise
    assert.fail('Expected transaction to revert')
  } catch (error) {
    const revertFound = error.message.search('VM Exception while processing transaction: revert') >= 0
    const msg = errorMessage === '' ? `Expected "revert", got ${error} instead` : errorMessage
    assert(revertFound, msg)
  }
}

export async function exec(command: string, args: string[]) {
  return new Promise((resolve, reject) => {
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

function execCmd(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
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
  assert(
    a
      .minus(b)
      .abs()
      .comparedTo(epsilon) === -1,
    errorMessage
  )
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

  const logArgs = Object.keys(log.args)
    .filter((k) => k !== '__length__' && isNaN(parseInt(k, 10)))
    .sort()

  assert.deepEqual(logArgs, Object.keys(args).sort(), `Argument names do not match for ${event}`)

  for (const k of logArgs) {
    if (typeof args[k] === 'function') {
      args[k](log.args[k], `Event ${event}, arg: ${k} do not match`)
    } else if (isNumber(log.args[k]) || isNumber(args[k])) {
      assertEqualBN(log.args[k], args[k], `Event ${event}, arg: ${k} do not match`)
    } else {
      assert.equal(log.args[k], args[k], `Event ${event}, arg: ${k} do not match`)
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
    `expected ${expected.toString(10)} to be within ${margin.toString(10)} of ${actual.toString(10)}. ${msg || ''}`
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


export function assertEqualBNArray(value: number[] | BN[] | BigNumber[], expected: number[] | BN[] | BigNumber[], msg?: string) {
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
    `expected ${value.toString()} to be greater than or equal to ${expected.toString()}. ${msg ||
      ''}`
  )
}

export const isSameAddress = (minerAddress, otherAddress) => {
  return minerAddress.toLowerCase() === otherAddress.toLowerCase()
}

// TODO(amy): Pull this list from the build artifacts instead
export const proxiedContracts: string[] = [
  'Attestations',
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
