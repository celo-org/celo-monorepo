import { Err, isErr, isOk, Ok, Result, RootError } from '@celo/base'
import { JsonFragment } from '@ethersproject/abi'
import { Provider } from '@ethersproject/abstract-provider'
import { JsonRpcProvider } from '@ethersproject/providers'
import { fetch } from 'cross-fetch'
import proxyV1 from './static/proxy-v1'
import usdcProxy from './static/usdc-proxy'
import { Address, KnownProxy } from './types'

export enum FetchAbiErrorTypes {
  FetchAbiError = 'FetchAbiError',
  NoProxy = 'NoProxy',
}

export class FetchingAbiError extends RootError<FetchAbiErrorTypes.FetchAbiError> {
  constructor(error: Error) {
    super(FetchAbiErrorTypes.FetchAbiError)
    this.message = error.message
  }
}

export class NoProxyError extends RootError<FetchAbiErrorTypes.NoProxy> {
  constructor(error: Error) {
    super(FetchAbiErrorTypes.NoProxy)
    this.message = error.message
  }
}

export type FetchAbiError = FetchingAbiError | NoProxyError

export interface AbiFetcher {
  fetchAbiForAddress: (address: Address) => Promise<Result<JsonFragment[], FetchAbiError>>
}

export class SourcifyAbiFetcher implements AbiFetcher {
  constructor(public readonly chainId: number) {}
  async fetchAbiForAddress(address: Address): Promise<Result<JsonFragment[], FetchingAbiError>> {
    const request = await fetch(
      `https://repo.sourcify.dev/contracts/full_match/${this.chainId}/${address}/metadata.json`
    )
    if (!request.ok) {
      return Err(new FetchingAbiError(new Error('Could not fetch ABI')))
    }

    const data = await request.json()
    const abi = data.output.abi
    return Ok(abi)
  }
}

export class ExplorerAbiFetcher implements AbiFetcher {
  constructor(
    public readonly baseUrl: string,
    public readonly apiKey: string | undefined = undefined
  ) {}
  async fetchAbiForAddress(address: Address): Promise<Result<JsonFragment[], FetchingAbiError>> {
    const apiKeyS = this.apiKey ? `&apikey=${this.apiKey}` : ''
    const request = await fetch(
      `${this.baseUrl}/api?module=contract&action=getabi&address=${address}${apiKeyS}`
    )
    if (!request.ok) {
      return Err(new FetchingAbiError(new Error('Could not fetch ABI. Status:' + request.status)))
    }

    const data = await request.json()

    if (data.status != '1') {
      return Err(new FetchingAbiError(new Error(`Error from ${this.baseUrl}: $${data.result}`)))
    }
    const abi = JSON.parse(data.result)
    return Ok(abi)
  }
}

export class ProxyAbiFetcher implements AbiFetcher {
  constructor(
    public readonly provider: Provider,
    public readonly abiFetchers: AbiFetcher[],
    public readonly knownProxies: KnownProxy[] = [proxyV1, usdcProxy]
  ) {}
  async fetchAbiForAddress(address: Address): Promise<Result<JsonFragment[], FetchAbiError>> {
    const contractCode = await this.provider.getCode(address)
    const contractCodeStripped = stripMetadataFromBytecode(contractCode)
    const matchingProxy = this.knownProxies.find(
      (_) => stripMetadataFromBytecode(_.bytecode) === contractCodeStripped
    )

    if (!matchingProxy) {
      return Err(new NoProxyError(new Error('Is not a proxy')))
    }

    const implementationAdress = await this.getImplementationAddress(matchingProxy, address)

    // Get ABI of Implementation
    const implementationABI = await getAbisFromFetchers(this.abiFetchers, implementationAdress)

    if (!implementationABI.ok) {
      return implementationABI
    }

    return Ok(implementationABI.result[0])
  }

  async getImplementationAddress(knownProxy: KnownProxy, address: Address) {
    const storageRead = await this.provider.getStorageAt(address, knownProxy.location)
    return '0x' + storageRead.substring(26)
  }
}

// This method fetches ABIs from all fetchers and returns either all successful ones, or the error from the first one
export const getAbisFromFetchers = async (abiFetchers: AbiFetcher[], address: Address) => {
  const abis = await Promise.all(abiFetchers.map((f) => f.fetchAbiForAddress(address)))
  const successFullAbis = abis.filter(isOk)
  if (successFullAbis.length > 0) {
    return Ok(successFullAbis.map((_) => _.result))
  } else {
    const failedAbis = abis.find(isErr)
    return Err(failedAbis!.error)
  }
}

const celoSourcifyAbiFetcher = new SourcifyAbiFetcher(42220)
const celoBlockscoutAbiFetcher = new ExplorerAbiFetcher('https://explorer.celo.org')
const celoProvider = new JsonRpcProvider('https://forno.celo.org')
const proxyAbiFetcher = new ProxyAbiFetcher(celoProvider, [
  celoSourcifyAbiFetcher,
  celoBlockscoutAbiFetcher,
])
export const celoAbiFetchers = [proxyAbiFetcher, celoSourcifyAbiFetcher, celoBlockscoutAbiFetcher]

const ethSourcifyAbiFetcher = new SourcifyAbiFetcher(42220)
const etherscanAbiFetcher = new ExplorerAbiFetcher('https://api.etherscan.io')
const ethProvider = new JsonRpcProvider('https://mainnet-nethermind.blockscout.com/')
const ethProxyAbiFetcher = new ProxyAbiFetcher(ethProvider, [
  ethSourcifyAbiFetcher,
  etherscanAbiFetcher,
])
export const ethAbiFetchers = [ethProxyAbiFetcher, ethSourcifyAbiFetcher]

const stripMetadataFromBytecode = (bytecode: string): string => {
  // Docs:
  // https://docs.soliditylang.org/en/develop/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
  // Metadata format has changed once, but can be detected using last two bytes.
  switch (bytecode.substring(bytecode.length - 4)) {
    case '0029':
      // Format: 0xa1 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes of swarm> 0x00 0x29
      return bytecode.substring(0, bytecode.length - 43 * 2)
    case '0032':
      // Format:
      // 0xa2 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes of swarm>
      // 0x64 's' 'o' 'l' 'c' 0x43 <3 byte version encoding>
      // 0x00 0x32
      return bytecode.substring(0, bytecode.length - 52 * 2)
    default:
      return bytecode
  }
}
