import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'

export const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
export const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
export const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
export const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))
export const PRIVATE_KEY3 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff1'
export const ACCOUNT_ADDRESS3 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY3))
export const PRIVATE_KEY4 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff2'
export const ACCOUNT_ADDRESS4 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY4))
export const PRIVATE_KEY5 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff3'
export const ACCOUNT_ADDRESS5 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY5))
export const PRIVATE_KEY_NEVER =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890ffffff'
export const ACCOUNT_ADDRESS_NEVER = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY_NEVER))

export const CHAIN_ID = 44378

export const TYPED_DATA = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
}
