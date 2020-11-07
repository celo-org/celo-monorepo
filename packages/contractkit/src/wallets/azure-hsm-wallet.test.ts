import {
  Address,
  ensureLeading0x,
  normalizeAddressWith0x,
  trimLeading0x,
} from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { BigNumber } from 'bignumber.js'
import * as ethUtil from 'ethereumjs-util'
import Web3 from 'web3'
import { EncodedTransaction, Tx } from 'web3-core'
import { Signature } from '../utils/signature-utils'
import { recoverTransaction, verifyEIP712TypedDataSigner } from '../utils/signing-utils'
import { AzureHSMWallet } from './azure-hsm-wallet'
import {
  ACCOUNT_ADDRESS1,
  ACCOUNT_ADDRESS2,
  ACCOUNT_ADDRESS_NEVER,
  CHAIN_ID,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  TYPED_DATA,
} from './test-utils'

// Env var should hold service principal credentials
// https://www.npmjs.com/package/@azure/keyvault-keys
require('dotenv').config()

const USING_MOCK =
  typeof process.env.AZURE_KEY_NAME === 'undefined' ||
  process.env.AZURE_KEY_NAME === '<AZURE_KEY_NAME>'
const AZURE_KEY_NAME = USING_MOCK ? 'secp' : process.env.AZURE_KEY_NAME
const AZURE_VAULT_NAME = USING_MOCK ? 'mockVault' : process.env.AZURE_VAULT_NAME

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
      expect(process.env.AZURE_VAULT_NAME).toBeDefined()
      expect(process.env.AZURE_KEY_NAME).toBeDefined()
    }

    wallet = new AzureHSMWallet(AZURE_VAULT_NAME!)

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
                throw new Error(`A key with (name/id) ${keyName} was not found in this key vault`)
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
                // Azure HSM doesn't add the byte prefix (+27) while ecsign does
                // Subtract 27 to properly mock the HSM signer
                return new Signature(signature.v - 27, signature.r, signature.s)
              }
              throw new Error(`Unable to locate key: ${keyName}`)
            },
          }
        })
    }
  })

  describe('after initializing', () => {
    beforeEach(async () => {
      await wallet.init()
    })
    test('hasAccount should return false for keys that are not present', async () => {
      // Invalid key should not be present
      expect(await wallet.hasAccount('this is not a valid private key')).toBeFalsy()
    })

    test('hasAccount should return true for keys that are present', async () => {
      // Valid key should be present
      const address = await wallet.getAddressFromKeyName(AZURE_KEY_NAME!)
      expect(await wallet.hasAccount(address)).toBeTruthy()
    })

    describe('with an account', () => {
      describe('signing', () => {
        describe('using an unknown key', () => {
          let celoTransaction: Tx
          const unknownKey: string = 'invalidKey'
          const unknownAddress = ACCOUNT_ADDRESS_NEVER

          beforeEach(() => {
            celoTransaction = {
              from: unknownAddress,
              chainId: CHAIN_ID,
              value: Web3.utils.toWei('1', 'ether'),
              nonce: 0,
              gas: '10',
              gasPrice: '99',
              feeCurrency: '0x124356',
              gatewayFeeRecipient: '0x1234',
              gatewayFee: '0x5678',
              data: '0xabcdef',
            }
          })

          test('fails getting address from key', async () => {
            try {
              await wallet.getAddressFromKeyName(unknownKey)
              throw new Error('Expected exception to be thrown')
            } catch (e) {
              expect(e.message).toContain(
                `A key with (name/id) ${unknownKey} was not found in this key vault`
              )
            }
          })

          test('fails calling signTransaction', async () => {
            try {
              await wallet.signTransaction(celoTransaction)
              throw new Error('Expected exception to be thrown')
            } catch (e) {
              expect(e.message).toBe(`Could not find address ${unknownAddress}`)
            }
          })

          test('fails calling signPersonalMessage', async () => {
            const hexStr: string = '0xa1'
            try {
              await wallet.signPersonalMessage(unknownAddress, hexStr)
              throw new Error('Expected exception to be thrown')
            } catch (e) {
              expect(e.message).toBe(`Could not find address ${unknownAddress}`)
            }
          })

          test('fails calling signTypedData', async () => {
            try {
              await wallet.signTypedData(unknownAddress, TYPED_DATA)
              throw new Error('Expected exception to be thrown')
            } catch (e) {
              expect(e.message).toBe(`Could not find address ${unknownAddress}`)
            }
          })
        })

        describe('using a known key', () => {
          let celoTransaction: Tx
          const knownKey: string = AZURE_KEY_NAME!
          let knownAddress: Address
          const otherAddress: string = ACCOUNT_ADDRESS2

          beforeEach(async () => {
            knownAddress = await wallet.getAddressFromKeyName(knownKey)
            celoTransaction = {
              from: knownAddress,
              to: otherAddress,
              chainId: CHAIN_ID,
              value: Web3.utils.toWei('1', 'ether'),
              nonce: 0,
              gas: '10',
              gasPrice: '99',
              feeCurrency: '0x',
              gatewayFeeRecipient: '0x1234',
              gatewayFee: '0x5678',
              data: '0xabcdef',
            }
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

            // https://github.com/ethereum/go-ethereum/blob/38aab0aa831594f31d02c9f02bfacc0bef48405d/rlp/decode.go#L664
            test('signature with 0x00 prefix is canonicalized', async () => {
              // This tx is carefully constructed to produce an S value with the first byte as 0x00
              const celoTransactionZeroPrefix = {
                from: await wallet.getAddressFromKeyName(knownKey),
                to: ACCOUNT_ADDRESS2,
                chainId: CHAIN_ID,
                value: Web3.utils.toWei('1', 'ether'),
                nonce: 65,
                gas: '10',
                gasPrice: '99',
                feeCurrency: '0x',
                gatewayFeeRecipient: '0x1234',
                gatewayFee: '0x5678',
                data: '0xabcdef',
              }

              const signedTx: EncodedTransaction = await wallet.signTransaction(
                celoTransactionZeroPrefix
              )
              expect(signedTx.tx.s.startsWith('0x00')).toBeFalsy()
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
              const valid = verifySignature(hexStr, signedMessage, knownAddress)
              expect(valid).toBeTruthy()
            })
          })

          describe('when calling signTypedData', () => {
            test('succeeds', async () => {
              const signedMessage = await wallet.signTypedData(knownAddress, TYPED_DATA)
              expect(signedMessage).not.toBeUndefined()
              const valid = verifyEIP712TypedDataSigner(TYPED_DATA, signedMessage, knownAddress)
              expect(valid).toBeTruthy()
            })
          })
        })
      })
    })
  })
})
