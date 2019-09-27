import bip32 = require('bip32')
import bip39 = require('bip39')
import * as fs from 'fs'
import Web3 from 'web3'
import { NETWORK_NAME } from '../contracts/network-name'
import { Logger } from '../src/logger'
import StaticNodeUtils from '../src/static-node-utils'
import { Web3Utils } from '../src/web3-utils'

// Set this to true if you have a local node running on 127.0.0.1 and you want to test against that
const runAgainstLocalNode: boolean = false
let cachedIpAddress: string | null = runAgainstLocalNode ? '127.0.0.1' : null

const HTTP_PROVIDER_PORT = 8545

function generatePrivateKey(mnemonic: string, accountType: number, index: number): string {
  const seed = bip39.mnemonicToSeed(mnemonic)
  const node = bip32.fromSeed(seed)
  const newNode = node.derive(accountType).derive(index)

  return newNode.privateKey.toString('hex')
}

export function generateAccountAddressFromPrivateKey(privateKey: string): string {
  if (!privateKey.toLowerCase().startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  // @ts-ignore-next-line
  return new Web3.modules.Eth().accounts.privateKeyToAccount(privateKey).address
}

// Mnemonic taken from .env.mnemonic.<NETWORK_NAME> file in celo-monorepo
function getMnemonic(networkName: string): string {
  const mnemonicFile = `${__dirname}/../../../.env.mnemonic.${networkName}`
  Logger.debug('getMnemonic', `Reading mnemonic from ${mnemonicFile}`)
  const mnemonicFileContent = fs.readFileSync(mnemonicFile).toString()
  const lines = mnemonicFileContent.split('\n')
  for (const line of lines) {
    if (line.startsWith('MNEMONIC')) {
      // TODO(ashishb): This is hacky, we should eventually move to `properties-reader` or a similar package.
      const mnemonic = line
        .split('=')[1]
        .replace('"', '')
        .replace('"', '')
        .trim()
      return mnemonic
    }
  }
  throw new Error(`Mnemonic not found in ${mnemonicFile}`)
}

// Alternative way to generate this:
// celotooljs generate bip32 --accountType validator --index 0 --mnemonic "${MNEMONIC}"
export function getMiner0PrivateKey(networkName: string): string {
  return generatePrivateKey(getMnemonic(networkName), 0, 0)
}

// Alternative way to generate this:
// celotooljs generate bip32 --accountType validator --index 1 --mnemonic "${MNEMONIC}"
export function getMiner1PrivateKey(networkName: string): string {
  return generatePrivateKey(getMnemonic(networkName), 0, 1)
}

// Miner's account which is expected to contain a non-zero balance.
// Alternative way to generate this:
// celotooljs generate account-address --private-key ${MINER0_PRIVATE_KEY}
export function getMiner0AccountAddress(networkName: string): string {
  return generateAccountAddressFromPrivateKey(getMiner0PrivateKey(networkName))
}

// Miner's account which is expected to contain a non-zero balance.
// Alternative way to generate this:
// celotooljs generate account-address --private-key ${MINER1_PRIVATE_KEY}
export function getMiner1AccountAddress(networkName: string): string {
  return generateAccountAddressFromPrivateKey(getMiner1PrivateKey(networkName))
}

export async function getIpAddressOfTxnNode(networkName: string): Promise<string> {
  if (cachedIpAddress === null) {
    Logger.debug('getIpAddressOfTxnNode', `network name is "${networkName}"`)
    const staticNodes: string = JSON.parse(await StaticNodeUtils.getStaticNodesAsync(networkName))
    // Format: enode://<enode>@IP:<port>
    const singleEnode = staticNodes[0]
    cachedIpAddress = singleEnode.split('@')[1].split(':')[0]
  }
  Logger.debug(
    'getIpAddressOfTxnNode',
    `IP address of nodes[0] of ${NETWORK_NAME} is ${cachedIpAddress}`
  )
  if (cachedIpAddress === null) {
    throw new Error(`IP address for ${NETWORK_NAME} is null`)
  }
  return cachedIpAddress
}

export async function getWeb3ForTesting(): Promise<Web3> {
  const ipAddress: string = await getIpAddressOfTxnNode(NETWORK_NAME)
  return Web3Utils.getWeb3('http', ipAddress, HTTP_PROVIDER_PORT)
}

export async function getWeb3WithSigningAbilityForTesting(privateKey: string): Promise<Web3> {
  const ipAddress: string = await getIpAddressOfTxnNode(NETWORK_NAME)
  return Web3Utils.getWeb3WithSigningAbility('http', ipAddress, HTTP_PROVIDER_PORT, privateKey)
}
