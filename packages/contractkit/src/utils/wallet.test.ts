import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import Web3 from 'web3'
import { Tx } from 'web3/eth/types'
import { EncodedTransaction } from 'web3/types'
import { EIP712TypedData } from './sign-typed-data-utils'
import { recoverTransaction } from './signing-utils'
import { DefaultWallet, Wallet } from './wallet'

const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))

describe('Wallet class', () => {
  let wallet: Wallet

  beforeEach(() => {
    wallet = new DefaultWallet()
  })

  test('starts with no accounts', () => {
    expect(wallet.getAccounts().length).toBe(0)
  })

  test('fails if you add an invalid private key', () => {
    try {
      wallet.addAccount('this is not a valid private key')
    } catch (e) {
      expect(e.message).toBe('private key length is invalid')
    }
  })

  test('succeds if you add an private key without 0x', () => {
    wallet.addAccount(PRIVATE_KEY1)
    expect(wallet.hasAccount(ACCOUNT_ADDRESS1)).toBeTruthy()
  })

  test('succeds if you add an private key with 0x', () => {
    wallet.addAccount(PRIVATE_KEY2)
    expect(wallet.hasAccount(ACCOUNT_ADDRESS2)).toBeTruthy()
  })

  describe('with an account', () => {
    const knownAddress = ACCOUNT_ADDRESS1
    const otherAddress = ACCOUNT_ADDRESS2

    beforeEach(() => {
      wallet.addAccount(PRIVATE_KEY1)
    })

    test('all address can be retrieved', () => {
      expect(wallet.getAccounts()).toMatchObject([ACCOUNT_ADDRESS1])
    })

    describe('signing', () => {
      describe('using an unknown address', () => {
        const unknownAddress: string = ACCOUNT_ADDRESS2
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

      describe('using a known address', () => {
        describe('when calling signTransaction', () => {
          let celoTransaction: Tx

          beforeEach(() => {
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

          test('succeds', async () => {
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
