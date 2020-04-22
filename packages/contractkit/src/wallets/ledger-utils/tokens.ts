// Copied from '@ledgerhq/hw-app-eth/erc20' because we need to change the path of the blob and support for address+chainId
import { Address, normalizeAddressWith0x } from '@celo/utils/lib/address'
import blob from './data'

/**
 * Retrieve the token information by a given contract address and chainId if any
 */
export const tokenInfoByAddressAndChainId = (
  contract: Address,
  chainId: number
): TokenInfo | null | undefined => get().byContractKey(generateContractKey(contract, chainId))

/**
 * list all the ERC20 tokens informations
 */
export const list = (): TokenInfo[] => get().list()

export interface TokenInfo {
  contractAddress: Address
  ticker: string
  decimals: number
  chainId: number
  signature: Buffer
  data: Buffer
}

/**
 * @return
 * -1: version1 < version2,
 *  0: version1 == version2,
 *  1: version1 > version2
 */
export function compareLedgerAppVersions(version1: string, version2: string): number {
  const numberV1 = stringVersionToNumber(version1)
  const numberV2 = stringVersionToNumber(version2)
  return numberV1 < numberV2 ? -1 : numberV1 === numberV2 ? 0 : 1
}

function stringVersionToNumber(version: string): number {
  const parts = version.split('.')
  return parts.reduce((accum, part) => (accum + Number(part)) * 1000, 0)
}

export interface API {
  byContractKey: (arg0: string) => TokenInfo | null | undefined
  list: () => TokenInfo[]
}

function generateContractKey(contract: Address, chainId: number): string {
  return [normalizeAddressWith0x(contract), chainId].join('-')
}

// this internal get() will lazy load and cache the data from the erc20 data blob
const get: () => API = (() => {
  let cache: API
  return () => {
    if (cache) {
      return cache
    }
    const buf = Buffer.from(blob, 'base64')
    const byContract: { [id: string]: TokenInfo } = {}
    const entries: TokenInfo[] = []
    let i = 0
    while (i < buf.length) {
      const length = buf.readUInt32BE(i)
      i += 4
      const item = buf.slice(i, i + length)
      let j = 0
      const tickerLength = item.readUInt8(j)
      j += 1
      const ticker = item.slice(j, j + tickerLength).toString('ascii')
      j += tickerLength
      const contractAddress: string = normalizeAddressWith0x(item.slice(j, j + 20).toString('hex'))
      j += 20
      const decimals = item.readUInt32BE(j)
      j += 4
      const chainId = item.readUInt32BE(j)
      j += 4
      const signature = item.slice(j)
      const entry: TokenInfo = {
        ticker,
        contractAddress,
        decimals,
        chainId,
        signature,
        data: item,
      }
      entries.push(entry)
      byContract[generateContractKey(contractAddress, chainId)] = entry
      i += length
    }
    const api = {
      list: () => entries,
      byContractKey: (id: string) => byContract[id],
    }
    cache = api
    return api
  }
})()
