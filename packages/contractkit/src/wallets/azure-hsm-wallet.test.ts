import { normalizeAddressWith0x, privateKeyToAddress, Address } from '@celo/utils/lib/address'
import Web3 from 'web3'
import { EncodedTransaction, Tx } from 'web3-core'
import { EIP712TypedData } from '../utils/sign-typed-data-utils'
import { recoverTransaction } from '../utils/signing-utils'
import { AzureHSMWallet } from './azure-hsm-wallet'

// Env var should hold service principal credentials
// https://www.npmjs.com/package/@azure/keyvault-keys
require('dotenv').config()

const VAULT_NAME = process.env.VAULT_NAME
const KEY_NAME = process.env.KEY_NAME
const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))

describe('AzureHSMWallet class', () => {
  // validate env file
  beforeAll(() => {
    expect(process.env.AZURE_CLIENT_ID).toBeDefined()
    expect(process.env.AZURE_CLIENT_SECRET).toBeDefined()
    expect(process.env.AZURE_TENANT_ID).toBeDefined()
    expect(process.env.VAULT_NAME).toBeDefined()
    expect(process.env.KEY_NAME).toBeDefined()
  })

  let wallet: AzureHSMWallet = new AzureHSMWallet(VAULT_NAME!)

  test('calling any function will fail before init', async () => {
    try {
      await wallet.getAccounts()
    } catch (e) {
      expect(e.message).toBe('wallet needs to be initialized first')
    }
    try {
      await wallet.hasAccount(ACCOUNT_ADDRESS1)
    } catch (e) {
      expect(e.message).toBe('wallet needs to be initialized first')
    }
  })

  beforeEach(async () => {
    await wallet.init()
  })

  test('hasKey should return true for keys that are present', async () => {
    // Invalid key should not be present
    expect(await wallet.hasAccount('this is not a valid private key')).toBeFalsy()

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
            expect(e.message).toBe(
              `Key ${unknownKey} not found in KeyVault ${process.env.VAULT_NAME}`
            )
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
          const typedData: EIP712TypedData = {
            types: { test: [{ name: 'test', type: 'string' }] },
            domain: { test: 'test' },
            message: { test: 'test' },
            primaryType: 'test',
          }
          try {
            await wallet.signTypedData(unknownAddress, typedData)
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
          })

          test.todo('returns a valid sign')
        })

        describe('when calling signTypedData', () => {
          test.todo('succeeds, needs a valid typedData to be tested')
          test.todo('returns a valid sign')
        })
      })
    })
  })
})
