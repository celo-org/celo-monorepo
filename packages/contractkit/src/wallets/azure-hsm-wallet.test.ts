import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import Web3 from 'web3'
import { Tx } from 'web3/eth/types'
import { EncodedTransaction } from 'web3/types'
import { recoverTransaction } from '../utils/signing-utils'
import { EIP712TypedData } from '../utils/sign-typed-data-utils'
import { AzureHSMWallet } from './azure-hsm-wallet'

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
    await expect(wallet.getAccounts()).rejects.toThrowError()
    await expect(wallet.hasAccount(ACCOUNT_ADDRESS1)).rejects.toThrowError()
  })

  beforeEach(async () => {
    await wallet.init()
  })

  test('hasKey should return true for keys that are present', async () => {
    expect(await wallet.hasAccount('this is not a valid private key')).toBeFalsy()
    const address = await wallet.getAddressFromKeyName(KEY_NAME!)
    expect(await wallet.hasAccount(address)).toBeTruthy()
  })

  describe('with an account', () => {
    describe('signing', () => {
      describe('using an unknown key', async () => {
        const unknownKey: string = 'invalidKey'
        const unknownAddress: string = await wallet.getAddressFromKeyName(unknownKey)
        test('fails calling signTransaction', async () => {
          const tsParams: Tx = {
            nonce: 'test',
            gas: 'test',
            to: 'test',
            from: unknownAddress,
            chainId: '1',
          }
          await expect(wallet.signTransaction(tsParams)).rejects.toThrowError()
        })

        test('fails calling signPersonalMessage', async () => {
          const hexStr: string = '0xa1'
          const unknownKey: string = 'invalidKey'
          const unknownAddress: string = await wallet.getAddressFromKeyName(unknownKey)
          await expect(wallet.signPersonalMessage(unknownAddress, hexStr)).rejects.toThrowError()
        })

        test('fails calling signTypedData', async () => {
          const typedData: EIP712TypedData = {
            types: { test: [{ name: 'test', type: 'string' }] },
            domain: { test: 'test' },
            message: { test: 'test' },
            primaryType: 'test',
          }
          await expect(wallet.signTypedData(unknownAddress, typedData)).rejects.toThrowError()
        })
      })

      describe('using a known key', async () => {
        describe('when calling signTransaction', async () => {
          let celoTransaction: Tx
          const knownKey: string = KEY_NAME!
          const knownAddress: string = await wallet.getAddressFromKeyName(knownKey)
          const otherAddress: string = ACCOUNT_ADDRESS1

          beforeEach(async () => {
            celoTransaction = {
              from: knownAddress,
              to: otherAddress,
              chainId: '2',
              value: Web3.utils.toWei('1', 'ether'),
              nonce: '0',
              gas: '10',
              gasPrice: '99',
              feeCurrency: '0x124356',
              gatewayFeeRecipient: '0x1234',
              gatewayFee: '0x5678',
              data: '0xabcdef',
            }
          })

          test('succeeds', async () => {
            await expect(wallet.signTransaction(celoTransaction)).resolves.not.toBeUndefined()
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
          test('succeds', async () => {
            const hexStr: string = '0xa1'
            const knownKey: string = KEY_NAME!
            const knownAddress: string = await wallet.getAddressFromKeyName(knownKey)
            await expect(
              wallet.signPersonalMessage(knownAddress, hexStr)
            ).resolves.not.toBeUndefined()
          })

          test.todo('returns a valid sign')
        })

        describe('when calling signTypedData', () => {
          test.todo('succeds, needs a valid typedData to be tested')
          test.todo('returns a valid sign')
        })
      })
    })
  })
})
