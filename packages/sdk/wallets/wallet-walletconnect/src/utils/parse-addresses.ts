import { AddressUtils } from '@celo/utils'

interface AddressWithNetwork {
  address: string
  networkId: string
}

function invalidChain(chain: string) {
  return chain !== 'celo' && chain !== 'eip155'
}

// celo:0x123
function parseShortNameAddress(addressLike: string) {
  const [celo, address] = addressLike.split(':')
  if (invalidChain(celo) || !AddressUtils.isValidAddress(address)) {
    throw new Error('Invalid short name address')
  }

  // default to mainnet
  return { address, networkId: '42220' }
}

// <address>@<chain>:<network_id>
// 0x123@celo:1234
// 0x123@eip155:1234
function parseCaip50Address(addressLike: string) {
  const [address, chain, networkId] = addressLike.split(/[@:]/)

  if (!AddressUtils.isValidAddress(address) || invalidChain(chain)) {
    throw new Error(`Invalid CAIP50 address ${address}`)
  }

  return { address, networkId }
}

// <chain>:<network_id>:<address>
// celo:1234:0x123
// eip155:1234:0x123
function parseCaip10Address(addressLike: string) {
  const [chain, networkId, address] = addressLike.split(':')

  if (!AddressUtils.isValidAddress(address) || invalidChain(chain)) {
    throw new Error(`Invalid CAIP10 address ${address}`)
  }

  return { address, networkId }
}

export function parseAddress(addressLike: string): AddressWithNetwork {
  let lastError: Error | null = null
  for (const parse of [parseCaip10Address, parseCaip50Address, parseShortNameAddress]) {
    try {
      return parse(addressLike)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}
