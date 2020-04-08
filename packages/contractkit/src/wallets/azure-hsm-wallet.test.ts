import {
  Address,
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
  trimLeading0x,
} from '@celo/utils/lib/address'
import { BigNumber } from 'bignumber.js'
import * as ethUtil from 'ethereumjs-util'
import Web3 from 'web3'
import { EncodedTransaction, Tx } from 'web3-core'
import {
  recoverEIP712TypedDataSigner,
  recoverMessageSigner,
  recoverTransaction,
} from '../utils/signing-utils'
import { AzureHSMWallet } from './azure-hsm-wallet'
import { Signature } from './signers/azure-key-vault-client'

// Env var should hold service principal credentials
// https://www.npmjs.com/package/@azure/keyvault-keys
require('dotenv').config()

const USING_MOCK =
  typeof process.env.KEY_NAME === 'undefined' || process.env.KEY_NAME === '<KEY_NAME>'
const KEY_NAME = USING_MOCK ? 'secp' : process.env.KEY_NAME
const VAULT_NAME = USING_MOCK ? 'mockVault' : process.env.VAULT_NAME
const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))
const CHAIN_ID = 44378

const keyVaultAddresses: Map<string, { address: string; privateKey: string }> = new Map([
  [
    'secp',
    {
      address: ACCOUNT_ADDRESS1,
      privateKey: PRIVATE_KEY1,
    },
  ],
  [
    'secp2',
    {
      address: ACCOUNT_ADDRESS2,
      privateKey: PRIVATE_KEY2,
    },
  ],
])

// Sample data from the official EIP-712 example:
// https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
const TYPED_DATA = {
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

describe('AzureHSMWallet class', () => {
  let wallet: AzureHSMWallet

  // validate env file
  beforeEach(() => {
    // Use mock client if env vars not specified
    if (!USING_MOCK) {
      // Ensure all env vars are specified
      expect(process.env.AZURE_CLIENT_ID).toBeDefined()
      expect(process.env.AZURE_CLIENT_SECRET).toBeDefined()
      expect(process.env.AZURE_TENANT_ID).toBeDefined()
      expect(process.env.VAULT_NAME).toBeDefined()
      expect(process.env.KEY_NAME).toBeDefined()
    }

    wallet = new AzureHSMWallet(VAULT_NAME!)

    if (USING_MOCK) {
      jest
        .spyOn<any, any>(wallet, 'generateNewKeyVaultClient')
        .mockImplementation((_transport: any) => {
          return {
            getKeys: async (): Promise<string[]> => {
              return Array.from(keyVaultAddresses.keys())
            },
            getPublicKey: async (keyName: string): Promise<BigNumber> => {
              if (!keyVaultAddresses.has(keyName)) {
                throw new Error(`Key ${keyName} not found in KeyVault ${VAULT_NAME}`)
              }
              const privKey = keyVaultAddresses.get(keyName)!.privateKey
              const pubKey = ethUtil.privateToPublic(ethUtil.toBuffer(privKey))
              return new BigNumber(ensureLeading0x(pubKey.toString('hex')))
            },
            signMessage: async (message: Buffer, keyName: string): Promise<Signature> => {
              if (keyVaultAddresses.has(keyName)) {
                const trimmedKey = trimLeading0x(keyVaultAddresses.get(keyName)!.privateKey)
                const pkBuffer = Buffer.from(trimmedKey, 'hex')
                const signature = ethUtil.ecsign(message, pkBuffer)
                return new Signature(signature.v - 27, signature.r, signature.s)
              }
              throw new Error(`Unable to locate key: ${keyName}`)
            },
          }
        })
    }
  })

  describe('without initializing', () => {
    test('fails calling getAccounts', () => {
      try {
        wallet.getAccounts()
      } catch (e) {
        expect(e.message).toBe('wallet needs to be initialized first')
      }
    })

    test('fails calling hasAccount', () => {
      try {
        wallet.hasAccount(ACCOUNT_ADDRESS1)
      } catch (e) {
        expect(e.message).toBe('wallet needs to be initialized first')
      }
    })

    test('fails calling getAccounts', async () => {
      const txParams: Tx = {
        nonce: 1,
        gas: 'test',
        to: 'test',
        from: ACCOUNT_ADDRESS1,
        chainId: CHAIN_ID,
      }
      await expect(wallet.signTransaction(txParams)).rejects.toThrowError()
    })

    test('fails calling signPersonalMessage', async () => {
      await expect(wallet.signPersonalMessage(ACCOUNT_ADDRESS1, 'test')).rejects.toThrowError()
    })

    test('fails calling signTypedData', async () => {
      await expect(wallet.signTypedData(ACCOUNT_ADDRESS1, TYPED_DATA)).rejects.toThrowError()
    })
  })

  describe('after initializing', () => {
    beforeEach(async () => {
      await wallet.init()
    })
    test('hasKey should return false for keys that are not present', async () => {
      // Invalid key should not be present
      expect(await wallet.hasAccount('this is not a valid private key')).toBeFalsy()
    })

    test('hasKey should return true for keys that are present', async () => {
      // Valid key should be present
      const address = await wallet.getAddressFromKeyName(KEY_NAME!)
      expect(await wallet.hasAccount(address)).toBeTruthy()
    })

    describe('with an account', () => {
      describe('signing', () => {
        describe('using an unknown key', () => {
          let celoTransaction: Tx
          const unknownKey: string = 'invalidKey'
          const unknownAddress: Address = ACCOUNT_ADDRESS1

          beforeEach(() => {
            return new Promise(async (resolve) => {
              celoTransaction = {
                from: unknownAddress,
                to: unknownAddress,
                chainId: 2,
                value: Web3.utils.toWei('1', 'ether'),
                nonce: 0,
                gas: '10',
                gasPrice: '99',
                feeCurrency: '0x124356',
                gatewayFeeRecipient: '0x1234',
                gatewayFee: '0x5678',
                data: '0xabcdef',
              }
              resolve()
            })
          })

          test('fails getting address from key', async () => {
            try {
              await wallet.getAddressFromKeyName(unknownKey)
            } catch (e) {
              expect(e.message).toBe(`Key ${unknownKey} not found in KeyVault ${VAULT_NAME}`)
            }
          })

          test('fails calling signTransaction', async () => {
            try {
              await wallet.signTransaction(celoTransaction)
            } catch (e) {
              expect(e.message).toBe(`Could not find address ${unknownAddress}`)
            }
          })

          test('fails calling signPersonalMessage', async () => {
            const hexStr: string = '0xa1'
            try {
              await wallet.signPersonalMessage(unknownAddress, hexStr)
            } catch (e) {
              expect(e.message).toBe(`Could not find address ${unknownAddress}`)
            }
          })

          test('fails calling signTypedData', async () => {
            try {
              await wallet.signTypedData(unknownAddress, TYPED_DATA)
            } catch (e) {
              expect(e.message).toBe(`Could not find address ${unknownAddress}`)
            }
          })
        })

        describe('using a known key', () => {
          let celoTransaction: Tx
          const knownKey: string = KEY_NAME!
          let knownAddress: Address
          const otherAddress: string = ACCOUNT_ADDRESS1

          beforeEach(() => {
            return new Promise(async (resolve) => {
              knownAddress = await wallet.getAddressFromKeyName(knownKey)
              celoTransaction = {
                from: knownAddress,
                to: otherAddress,
                chainId: 2,
                value: Web3.utils.toWei('1', 'ether'),
                nonce: 0,
                gas: '10',
                gasPrice: '99',
                feeCurrency: '0x124356',
                gatewayFeeRecipient: '0x1234',
                gatewayFee: '0x5678',
                data: '0xabcdef',
              }
              resolve()
            })
          })

          describe('when calling signTransaction', () => {
            test('succeeds', async () => {
              const signedTx: EncodedTransaction = await wallet.signTransaction(celoTransaction)
              expect(signedTx).not.toBeUndefined()
            })

            test('with same signer', async () => {
              const signedTx: EncodedTransaction = await wallet.signTransaction(celoTransaction)
              const [, recoveredSigner] = recoverTransaction(signedTx.raw)
              expect(normalizeAddressWith0x(recoveredSigner)).toBe(
                normalizeAddressWith0x(knownAddress)
              )
            })
          })

          describe('when calling signPersonalMessage', () => {
            test('succeeds', async () => {
              const hexStr: string = ACCOUNT_ADDRESS1
              const signedMessage = await wallet.signPersonalMessage(knownAddress, hexStr)
              expect(signedMessage).not.toBeUndefined()
              const recoveredSigner = recoverMessageSigner(hexStr, signedMessage)
              expect(normalizeAddressWith0x(recoveredSigner)).toBe(
                normalizeAddressWith0x(knownAddress)
              )
            })
          })

          describe('when calling signTypedData', () => {
            test('succeeds', async () => {
              const signedMessage = await wallet.signTypedData(knownAddress, TYPED_DATA)
              expect(signedMessage).not.toBeUndefined()
              const recoveredSigner = recoverEIP712TypedDataSigner(TYPED_DATA, signedMessage)
              expect(normalizeAddressWith0x(recoveredSigner)).toBe(
                normalizeAddressWith0x(knownAddress)
              )
            })
          })
        })
      })
    })
  })
})
