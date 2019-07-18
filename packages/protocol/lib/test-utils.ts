import { hasEntryInRegistry, usesRegistry } from '@celo/protocol/lib/registry-utils'
import BigNumber from 'bignumber.js'
import * as chai from 'chai'
import * as chaiSubset from 'chai-subset'
import { spawn } from 'child_process'
import { keccak256 } from 'ethereumjs-util'
import {
  ExchangeInstance,
  ProxyInstance,
  RegistryInstance,
  ReserveInstance,
  StableTokenInstance,
  UsingRegistryInstance,
} from 'types'
// tslint:disable-next-line: ordered-imports
import BN = require('bn.js')
import Web3 = require('web3')

const isNumber = (x: any) =>
  typeof x === 'number' || (BN as any).isBN(x) || BigNumber.isBigNumber(x)

chai.use(chaiSubset)

const assert = chai.assert

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export function stripHexEncoding(hexString: string) {
  return hexString.substr(0, 2) === '0x' ? hexString.substr(2) : hexString
}

export function assertContainSubset(superset: any, subset: any) {
  const assert2: any = chai.assert
  return assert2.containSubset(superset, subset)
}

export async function advanceBlockNum(numBlocks: number, web3: Web3) {
  let returnValue: any
  for (let i: number = 0; i < numBlocks; i++) {
    returnValue = new Promise((resolve, reject) => {
      web3.currentProvider.send(
        {
          jsonrpc: '2.0',
          method: 'evm_mine',
          params: [],
          id: new Date().getTime(),
        },
        // @ts-ignore
        (err: any, result: any) => {
          if (err) {
            return reject(err)
          }
          return resolve(result)
        }
      )
    })
  }
  return returnValue
}

export async function timeTravel(seconds: number, web3: Web3) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [seconds],
        id: new Date().getTime(),
      },
      // @ts-ignore
      (err: any, result: any) => {
        if (err) {
          return reject(err)
        }
        return resolve(result)
      }
    )
  })
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
    assert.fail('Expected revert not received')
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0
    if (errorMessage === '') {
      assert(revertFound, `Expected "revert", got ${error} instead`)
    } else {
      assert(revertFound, errorMessage)
    }
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
      (await registry.getAddressFor(contractName)).toLowerCase(),
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

export const assertStableTokenMinter = async (getContract: any) => {
  const stableToken: StableTokenInstance = await getContract('StableToken', 'proxiedContract')
  const exchange: ExchangeInstance = await getContract('Exchange', 'proxiedContract')
  assert.equal(
    await stableToken.minter(),
    exchange.address,
    'StableToken minter not set to Exchange'
  )
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
  value: number | BN | BigNumber,
  expected: number | BN | BigNumber,
  msg?: string
) {
  assert(
    web3.utils.toBN(value).eq(web3.utils.toBN(expected)),
    `expected ${expected.toString()} and got ${value.toString()}. ${msg || ''}`
  )
}

export const getReserveBalance = async (web3: Web3, getContract: any): Promise<string> => {
  const reserve: ReserveInstance = await getContract('Reserve', 'proxiedContract')
  return (await web3.eth.getBalance(reserve.address)).toString()
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
  advanceBlockNum,
  assertContainSubset,
  assertRevert,
  timeTravel,
  isSameAddress,
}
