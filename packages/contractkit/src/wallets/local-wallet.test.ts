import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import Web3 from 'web3'
import { EncodedTransaction, Tx } from 'web3-core'
import { EIP712TypedData } from '../utils/sign-typed-data-utils'
import {
  recoverTransaction,
  recoverMessageSigner,
  recoverEIP712TypedDataSigner,
} from '../utils/signing-utils'
import { LocalWallet } from './local-wallet'

const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))

describe('Local wallet class', () => {
  let wallet: LocalWallet

  beforeEach(() => {
    wallet = new LocalWallet()
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

  test('succeeds if you add an private key without 0x', () => {
    wallet.addAccount(PRIVATE_KEY1)
    expect(wallet.hasAccount(ACCOUNT_ADDRESS1)).toBeTruthy()
  })

  test('succeeds if you add an private key with 0x', () => {
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
            nonce: 1,
            gas: 'test',
            to: 'test',
            from: unknownAddress,
            chainId: 1,
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
            // Sample data from the official EIP-712 example:
            // https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
            const typedData = {
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

            const signedMessage = await wallet.signTypedData(knownAddress, typedData)
            expect(signedMessage).not.toBeUndefined()
            const recoveredSigner = recoverEIP712TypedDataSigner(typedData, signedMessage)
            expect(normalizeAddressWith0x(recoveredSigner)).toBe(
              normalizeAddressWith0x(knownAddress)
            )
          })
        })
      })
    })
  })
})
