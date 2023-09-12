import { CeloTx, EncodedTransaction, Hex } from '@celo/connect'
import {
  normalizeAddressWith0x,
  privateKeyToAddress,
  privateKeyToPublicKey,
  trimLeading0x,
} from '@celo/utils/lib/address'
import { Encrypt } from '@celo/utils/lib/ecies'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { recoverTransaction, verifyEIP712TypedDataSigner } from '@celo/wallet-base'
import { TransactionSerializableEIP1559, parseTransaction } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import Web3 from 'web3'
import { LocalWallet } from './local-wallet'
import { StrongAddress } from '@celo/base/lib/address'

const CHAIN_ID = 44378

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

const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const PUBLIC_KEY1 = privateKeyToPublicKey(PRIVATE_KEY1)
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))

const FEE_ADDRESS = ACCOUNT_ADDRESS1
const CURRENCY_ADDRESS = ACCOUNT_ADDRESS2

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
      throw new Error('Expected exception to be thrown')
    } catch (e: any) {
      expect(e.message).toBe('Expected 32 bytes of private key')
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
        let celoTransaction: CeloTx
        const unknownAddress: string = ACCOUNT_ADDRESS2

        beforeEach(() => {
          celoTransaction = {
            from: unknownAddress,
            to: unknownAddress,
            chainId: 2,
            value: Web3.utils.toWei('1', 'ether'),
            nonce: 0,
            gas: '10',
            gasPrice: '99',
            feeCurrency: CURRENCY_ADDRESS,
            gatewayFeeRecipient: FEE_ADDRESS,
            gatewayFee: '0x5678',
            data: '0xabcdef',
          }
        })

        test('fails calling signTransaction', async () => {
          await expect(
            wallet.signTransaction(celoTransaction)
          ).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Could not find address 0x588e4b68193001e4d10928660ab4165b813717c0"`
          )
        })

        test('fails calling signPersonalMessage', async () => {
          const hexStr: string = '0xa1'
          await expect(
            wallet.signPersonalMessage(unknownAddress, hexStr)
          ).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Could not find address 0x588e4b68193001e4d10928660ab4165b813717c0"`
          )
        })

        test('fails calling signTypedData', async () => {
          await expect(
            wallet.signTypedData(unknownAddress, TYPED_DATA)
          ).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Could not find address 0x588e4b68193001e4d10928660ab4165b813717c0"`
          )
        })
      })

      describe('using a known address', () => {
        describe('when calling signTransaction', () => {
          let celoTransactionWithGasPrice: CeloTx

          beforeEach(() => {
            celoTransactionWithGasPrice = {
              from: knownAddress,
              to: otherAddress,
              chainId: CHAIN_ID,
              value: Web3.utils.toWei('1', 'ether'),
              nonce: 0,
              gas: '10',
              gasPrice: '99',
              feeCurrency: '0x',
              gatewayFeeRecipient: FEE_ADDRESS,
              gatewayFee: '0x5678',
              data: '0xabcdef' as const,
            }
          })

          test('succeeds with legacy', async () => {
            await expect(wallet.signTransaction(celoTransactionWithGasPrice)).resolves
              .toMatchInlineSnapshot(`
              {
                "raw": "0xf88480630a80941be31a94361a391bbafb2a4ccd704f57dc04d4bb82567894588e4b68193001e4d10928660ab4165b813717c0880de0b6b3a764000083abcdef83015ad8a09e121a99dc0832a9f4d1d71500b3c8a69a3c064d437c225d6292577ffcc45a71a02c5efa3c4b58953c35968e42d11d3882dacacf45402ee802824268b7cd60daff",
                "tx": {
                  "feeCurrency": "0x",
                  "gas": "0x0a",
                  "gasPrice": "0x63",
                  "gatewayFee": "0x5678",
                  "gatewayFeeRecipient": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
                  "hash": "0xd24898ee3f68caa01fe065784453db7360bf783060fcbd18033f9d254ab8b082",
                  "input": "0xabcdef",
                  "nonce": "0",
                  "r": "0x9e121a99dc0832a9f4d1d71500b3c8a69a3c064d437c225d6292577ffcc45a71",
                  "s": "0x2c5efa3c4b58953c35968e42d11d3882dacacf45402ee802824268b7cd60daff",
                  "to": "0x588e4b68193001e4d10928660ab4165b813717c0",
                  "v": "0x015ad8",
                  "value": "0x0de0b6b3a7640000",
                },
                "type": "celo-legacy",
              }
            `)
          })

          test('succeeds with eip1559', async () => {
            const transaction1559 = {
              ...celoTransactionWithGasPrice,
              gasPrice: undefined,
              feeCurrency: undefined,
              maxFeePerGas: '99',
              maxPriorityFeePerGas: '99',
            }
            await expect(wallet.signTransaction(transaction1559)).resolves.toMatchInlineSnapshot(`
              {
                "raw": "0x7cf88682ad5a8063630a80941be31a94361a391bbafb2a4ccd704f57dc04d4bb82567894588e4b68193001e4d10928660ab4165b813717c0880de0b6b3a764000083abcdefc001a0cfa1e1b30d1e4617ce80922d853c5e8b54b21f5ed6604438f90280ef2f0b7fd0a06fd8eee02fbdd421136fb45e6851ce72b5d87a2c06b2e136ef1a062df9256f4e",
                "tx": {
                  "accessList": [],
                  "feeCurrency": "0x",
                  "gas": "0x0a",
                  "gatewayFee": "0x5678",
                  "gatewayFeeRecipient": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
                  "hash": "0x29327536ba9901fde64b1b86882fd173517b41cd8bc8245e3761847d9b231c6d",
                  "input": "0xabcdef",
                  "maxFeePerGas": "0x63",
                  "maxPriorityFeePerGas": "0x63",
                  "nonce": "0",
                  "r": "0xcfa1e1b30d1e4617ce80922d853c5e8b54b21f5ed6604438f90280ef2f0b7fd0",
                  "s": "0x6fd8eee02fbdd421136fb45e6851ce72b5d87a2c06b2e136ef1a062df9256f4e",
                  "to": "0x588e4b68193001e4d10928660ab4165b813717c0",
                  "v": "0x01",
                  "value": "0x0de0b6b3a7640000",
                },
                "type": "cip42",
              }
            `)
          })

          test('matches behavior of viem 1559', async () => {
            const account = privateKeyToAccount(PRIVATE_KEY2)
            const wallet2 = new LocalWallet()
            // wallet 1 uses a private key that does not start with 0x which doesnt work for viem
            wallet2.addAccount(PRIVATE_KEY2)

            const transaction1559 = {
              ...celoTransactionWithGasPrice,
              from: ACCOUNT_ADDRESS2,
              to: otherAddress,
              gasPrice: undefined,
              feeCurrency: undefined,
              gatewayFeeRecipient: undefined,
              gatewayFee: undefined,
              maxFeePerGas: '99',
              maxPriorityFeePerGas: '99',
              data: celoTransactionWithGasPrice.data as Hex,
            }
            const transaction1559Viem: TransactionSerializableEIP1559 = {
              ...transaction1559,
              type: 'eip1559',
              gas: BigInt(transaction1559.gas as string),
              to: transaction1559.to as StrongAddress,
              value: BigInt(transaction1559.value as string),
              maxFeePerGas: BigInt(transaction1559.maxFeePerGas as string),
              maxPriorityFeePerGas: BigInt(transaction1559.maxPriorityFeePerGas as string),
              accessList: undefined,
              chainId: celoTransactionWithGasPrice.chainId as number,
            }
            const signedTransaction = await wallet2.signTransaction(transaction1559)
            const viemSignedTransaction = await account.signTransaction(transaction1559Viem)

            expect(parseTransaction(signedTransaction.raw)).toEqual(
              parseTransaction(viemSignedTransaction)
            )
            expect(recoverTransaction(signedTransaction.raw)).toEqual(
              recoverTransaction(viemSignedTransaction)
            )
            expect(signedTransaction.raw).toEqual(viemSignedTransaction)
          })

          test('succeeds with cip42', async () => {
            const transaction42 = {
              ...celoTransactionWithGasPrice,
              gasPrice: undefined,
              maxFeePerGas: '99',
              maxPriorityFeePerGas: '99',
              feeCurrency: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            }
            await expect(wallet.signTransaction(transaction42)).resolves.toMatchInlineSnapshot(`
              {
                "raw": "0x7cf89a82ad5a8063630a94cd2a3d9f938e13cd947ec05abc7fe734df8dd826941be31a94361a391bbafb2a4ccd704f57dc04d4bb82567894588e4b68193001e4d10928660ab4165b813717c0880de0b6b3a764000083abcdefc080a0c610507b2ac3cff80dd7017419021196807d605efce0970c18cde48db33c27d1a01799477e0f601f554f0ee6f7ac21490602124801e9f7a99d9605249b90f03112",
                "tx": {
                  "accessList": [],
                  "feeCurrency": "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826",
                  "gas": "0x0a",
                  "gatewayFee": "0x5678",
                  "gatewayFeeRecipient": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
                  "hash": "0x7afcef8db391ff574b7f9c9205399b8ab094fc9fc8afbfb881204cbaaf093365",
                  "input": "0xabcdef",
                  "maxFeePerGas": "0x63",
                  "maxPriorityFeePerGas": "0x63",
                  "nonce": "0",
                  "r": "0xc610507b2ac3cff80dd7017419021196807d605efce0970c18cde48db33c27d1",
                  "s": "0x1799477e0f601f554f0ee6f7ac21490602124801e9f7a99d9605249b90f03112",
                  "to": "0x588e4b68193001e4d10928660ab4165b813717c0",
                  "v": "0x",
                  "value": "0x0de0b6b3a7640000",
                },
                "type": "cip42",
              }
            `)
          })

          test('with same signer', async () => {
            const signedTx: EncodedTransaction = await wallet.signTransaction(
              celoTransactionWithGasPrice
            )
            const [, recoveredSigner] = recoverTransaction(signedTx.raw)
            expect(normalizeAddressWith0x(recoveredSigner)).toBe(
              normalizeAddressWith0x(knownAddress)
            )
          })

          // https://github.com/ethereum/go-ethereum/blob/38aab0aa831594f31d02c9f02bfacc0bef48405d/rlp/decode.go#L664
          test('signature with 0x00 prefix is canonicalized', async () => {
            // This tx is carefully constructed to produce an S value with the first byte as 0x00
            const celoTransactionZeroPrefix = {
              from: ACCOUNT_ADDRESS1,
              to: ACCOUNT_ADDRESS2,
              chainId: CHAIN_ID,
              value: Web3.utils.toWei('1', 'ether'),
              nonce: 65,
              gas: '10',
              gasPrice: '99',
              feeCurrency: '0x',
              gatewayFeeRecipient: FEE_ADDRESS,
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
        describe('when using signTransaction with type CIP42', () => {
          let celoTransactionBase: CeloTx
          let feeCurrency = '0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f'
          let maxFeePerGas = '0x100000000'
          let maxPriorityFeePerGas = '0x100000000'

          beforeEach(() => {
            celoTransactionBase = {
              gas: '1000000000',
              from: knownAddress,
              to: otherAddress,
              chainId: CHAIN_ID,
              value: Web3.utils.toWei('1', 'ether'),
              nonce: 0,
              data: '0xabcdef',
            }
          })

          describe('when feeCurrency and maxPriorityFeePerGas and maxFeePerGas are set', () => {
            it('signs as a CIP42 tx', async () => {
              const transaction: CeloTx = {
                ...celoTransactionBase,
                feeCurrency,
                maxFeePerGas,
                maxPriorityFeePerGas,
              }
              const signedTx: EncodedTransaction = await wallet.signTransaction(transaction)
              expect(signedTx.raw).toMatch(/^0x7c/)
            })
          })
          describe('when feeCurrency and maxFeePerGas but not maxPriorityFeePerGas are set', () => {
            it('throws error', async () => {
              const transaction: CeloTx = {
                ...celoTransactionBase,
                feeCurrency,
                maxFeePerGas,
                maxPriorityFeePerGas: undefined,
              }
              expect(() =>
                wallet.signTransaction(transaction)
              ).rejects.toThrowErrorMatchingInlineSnapshot(
                `""gasPrice" or "maxFeePerGas" and "maxPriorityFeePerGas" are missing"`
              )
            })
          })

          describe('when feeCurrency and maxPriorityFeePerGas but not maxFeePerGas are set', () => {
            it('throws error', async () => {
              const transaction: CeloTx = {
                ...celoTransactionBase,
                feeCurrency,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas,
              }
              expect(() =>
                wallet.signTransaction(transaction)
              ).rejects.toThrowErrorMatchingInlineSnapshot(
                `""gasPrice" or "maxFeePerGas" and "maxPriorityFeePerGas" are missing"`
              )
            })
          })

          describe('when gas and one of maxPriorityFeePerGas or maxFeePerGas are set', () => {
            it('throws explaining only one kind of gas fee can be set', async () => {
              const transaction: CeloTx = {
                ...celoTransactionBase,
                maxFeePerGas,
                maxPriorityFeePerGas,
                gasPrice: '0x100000000',
              }
              expect(async () => await wallet.signTransaction(transaction)).rejects.toThrowError(
                'when "maxFeePerGas" or "maxPriorityFeePerGas" are set, "gasPrice" must not be set'
              )
            })
          })

          describe('when maxPriorityFeePerGas / maxFeePerGas are set but not feeCurrency', () => {
            it('signs as a EIP1559 tx', async () => {
              const transaction: CeloTx = {
                ...celoTransactionBase,
                maxFeePerGas,
                maxPriorityFeePerGas,
              }
              const signedTx: EncodedTransaction = await wallet.signTransaction(transaction)
              expect(signedTx.raw).toMatch(/^0x02/)
            })
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

    describe('decryption', () => {
      describe('using an unknown address', () => {
        test('fails calling decrypt', async () => {
          await expect(
            wallet.decrypt(ACCOUNT_ADDRESS2, Buffer.from('anything'))
          ).rejects.toThrowError()
        })
      })

      describe('using a known address', () => {
        test('properly decrypts the ciphertext', async () => {
          const plaintext = 'test_plaintext'
          const ciphertext = Encrypt(
            Buffer.from(trimLeading0x(PUBLIC_KEY1), 'hex'),
            Buffer.from(plaintext)
          )
          const decryptedPlaintext = await wallet.decrypt(ACCOUNT_ADDRESS1, ciphertext)
          expect(decryptedPlaintext.toString()).toEqual(plaintext)
        })
      })
    })
  })
})
