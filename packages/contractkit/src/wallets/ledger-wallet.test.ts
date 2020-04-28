import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
  trimLeading0x,
} from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
// @ts-ignore-next-line
import { account as Account } from 'eth-lib'
import * as ethUtil from 'ethereumjs-util'
import Web3 from 'web3'
import { EncodedTransaction, Tx } from 'web3-core'
import {
  chainIdTransformationForSigning,
  getHashFromEncoded,
  recoverTransaction,
  verifyEIP712TypedDataSigner,
} from '../utils/signing-utils'
import { AddressValidation, LedgerWallet } from './ledger-wallet'

// Update this variable when testing using a physical device
const USE_PHYSICAL_LEDGER = false
// Increase timeout to give developer time to respond on device
const TEST_TIMEOUT_IN_MS = USE_PHYSICAL_LEDGER ? 30 * 1000 : 1 * 1000

const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))
const PRIVATE_KEY3 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff1'
const ACCOUNT_ADDRESS3 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY3))
const PRIVATE_KEY4 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff2'
const ACCOUNT_ADDRESS4 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY4))
const PRIVATE_KEY5 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff3'
const ACCOUNT_ADDRESS5 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY5))
const PRIVATE_KEY_NEVER = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890ffffff'
const ACCOUNT_ADDRESS_NEVER = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY_NEVER))

const ledgerAddresses: { [myKey: string]: { address: string; privateKey: string } } = {
  "44'/52752'/0'/0/0": {
    address: ACCOUNT_ADDRESS1,
    privateKey: PRIVATE_KEY1,
  },
  "44'/52752'/0'/0/1": {
    address: ACCOUNT_ADDRESS2,
    privateKey: PRIVATE_KEY2,
  },
  "44'/52752'/0'/0/2": {
    address: ACCOUNT_ADDRESS3,
    privateKey: PRIVATE_KEY3,
  },
  "44'/52752'/0'/0/3": {
    address: ACCOUNT_ADDRESS4,
    privateKey: PRIVATE_KEY4,
  },
  "44'/52752'/0'/0/4": {
    address: ACCOUNT_ADDRESS5,
    privateKey: PRIVATE_KEY5,
  },
}

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

function mockLedger(wallet: LedgerWallet, mockForceValidation: () => void) {
  jest.spyOn<any, any>(wallet, 'generateNewLedger').mockImplementation((_transport: any) => {
    return {
      getAddress: async (derivationPath: string, forceValidation?: boolean) => {
        if (forceValidation) {
          mockForceValidation()
        }
        if (ledgerAddresses[derivationPath]) {
          return { address: ledgerAddresses[derivationPath].address, derivationPath }
        }
        return {}
      },
      signTransaction: async (derivationPath: string, data: string) => {
        if (ledgerAddresses[derivationPath]) {
          const hash = getHashFromEncoded(ensureLeading0x(data))
          const signature = Account.makeSigner(chainIdTransformationForSigning(CHAIN_ID))(
            hash,
            ledgerAddresses[derivationPath].privateKey
          )
          const [v, r, s] = Account.decodeSignature(signature)
          return { v, r, s }
        }
        throw new Error('Invalid Path')
      },
      signPersonalMessage: async (derivationPath: string, data: string) => {
        if (ledgerAddresses[derivationPath]) {
          const dataBuff = ethUtil.toBuffer(ensureLeading0x(data))
          const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)

          const trimmedKey = trimLeading0x(ledgerAddresses[derivationPath].privateKey)
          const pkBuffer = Buffer.from(trimmedKey, 'hex')
          const signature = ethUtil.ecsign(msgHashBuff, pkBuffer)
          return {
            v: signature.v,
            r: signature.r.toString('hex'),
            s: signature.s.toString('hex'),
          }
        }
        throw new Error('Invalid Path')
      },
      getAppConfiguration: async () => {
        return { arbitraryDataEnabled: 1, version: '0.0.0' }
      },
    }
  })
}

describe('LedgerWallet class', () => {
  let wallet: LedgerWallet
  let hardwareWallet: LedgerWallet
  let knownAddress = ACCOUNT_ADDRESS1
  let otherAddress = ACCOUNT_ADDRESS2
  const unknownAddress = ACCOUNT_ADDRESS_NEVER
  let mockForceValidation: any

  beforeEach(async () => {
    jest.setTimeout(TEST_TIMEOUT_IN_MS)

    if (USE_PHYSICAL_LEDGER) {
      try {
        // Use physical ledger if present
        // Recreation of the connection will fail, therefore we use a single object
        if (!hardwareWallet) {
          const transport: Transport = await TransportNodeHid.open('')
          hardwareWallet = await new LedgerWallet(undefined, undefined, transport)
        }
      } catch (e) {
        throw new Error(
          'Failed to connect to ledger. Ensure the Celo app is open and not already connected with a separate client'
        )
      }
    }
    wallet = new LedgerWallet()
    mockForceValidation = jest.fn((): void => {
      // do nothing
    })
    mockLedger(wallet, mockForceValidation)
  })

  describe('without initializing', () => {
    let celoTransaction: Tx
    beforeAll(() => {
      celoTransaction = {
        from: knownAddress,
        to: knownAddress,
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

    test('fails calling getAccounts', () => {
      try {
        wallet.getAccounts()
        throw new Error('Expected exception to be thrown')
      } catch (e) {
        expect(e.message).toBe('wallet needs to be initialized first')
      }
    })

    test('fails calling hasAccount', () => {
      try {
        wallet.hasAccount(ACCOUNT_ADDRESS1)
        throw new Error('Expected exception to be thrown')
      } catch (e) {
        expect(e.message).toBe('wallet needs to be initialized first')
      }
    })

    test('fails calling signTransaction', async () => {
      await expect(wallet.signTransaction(celoTransaction)).rejects.toThrowError()
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
      if (USE_PHYSICAL_LEDGER) {
        wallet = hardwareWallet
      }
      await wallet.init()
      if (USE_PHYSICAL_LEDGER) {
        knownAddress = wallet.getAccounts()[0]
        otherAddress = wallet.getAccounts()[1]
      }
    }, TEST_TIMEOUT_IN_MS)

    test('starts 5 accounts', () => {
      expect(wallet.getAccounts().length).toBe(5)
    })

    test('returns true if it has the accounts', () => {
      expect(wallet.hasAccount(knownAddress)).toBeTruthy()
    })

    test('returns false if it has the accounts', () => {
      expect(wallet.hasAccount(ACCOUNT_ADDRESS_NEVER)).toBeFalsy()
    })

    describe('with an account', () => {
      let celoTransaction: Tx
      beforeEach(() => {
        celoTransaction = {
          from: unknownAddress,
          to: unknownAddress,
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

      describe('signing', () => {
        describe('using an unknown address', () => {
          test('fails calling signTransaction', async () => {
            await expect(wallet.signTransaction(celoTransaction)).rejects.toThrowError()
          })

          test(
            'fails calling signPersonalMessage',
            async () => {
              const hexStr: string = '0xa1'
              await expect(
                wallet.signPersonalMessage(unknownAddress, hexStr)
              ).rejects.toThrowError()
            },
            TEST_TIMEOUT_IN_MS
          )

          test(
            'fails calling signTypedData',
            async () => {
              await expect(wallet.signTypedData(unknownAddress, TYPED_DATA)).rejects.toThrowError()
            },
            TEST_TIMEOUT_IN_MS
          )
        })

        describe('using a known address', () => {
          describe('when calling signTransaction', () => {
            beforeEach(() => {
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

            test(
              'succeeds',
              async () => {
                await expect(wallet.signTransaction(celoTransaction)).resolves.not.toBeUndefined()
              },
              TEST_TIMEOUT_IN_MS
            )

            test(
              'with same signer',
              async () => {
                const signedTx: EncodedTransaction = await wallet.signTransaction(celoTransaction)
                const [, recoveredSigner] = recoverTransaction(signedTx.raw)
                expect(normalizeAddressWith0x(recoveredSigner)).toBe(
                  normalizeAddressWith0x(knownAddress)
                )
              },
              TEST_TIMEOUT_IN_MS
            )

            // https://github.com/ethereum/go-ethereum/blob/38aab0aa831594f31d02c9f02bfacc0bef48405d/rlp/decode.go#L664
            test(
              'signature with 0x00 prefix is canonicalized',
              async () => {
                // This tx is carefully constructed to produce an S value with the first byte as 0x00
                const celoTransactionZeroPrefix = {
                  from: knownAddress,
                  to: otherAddress,
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
              },
              TEST_TIMEOUT_IN_MS
            )
          })
        })

        describe('when calling signPersonalMessage', () => {
          test(
            'succeeds',
            async () => {
              const hexStr: string = ACCOUNT_ADDRESS1
              const signedMessage = await wallet.signPersonalMessage(knownAddress, hexStr)
              expect(signedMessage).not.toBeUndefined()
              const valid = verifySignature(hexStr, signedMessage, knownAddress)
              expect(valid).toBeTruthy()
            },
            TEST_TIMEOUT_IN_MS
          )
        })

        describe('when calling signTypedData', () => {
          test(
            'succeeds',
            async () => {
              const signedMessage = await wallet.signTypedData(knownAddress, TYPED_DATA)
              expect(signedMessage).not.toBeUndefined()
              const valid = verifyEIP712TypedDataSigner(TYPED_DATA, signedMessage, knownAddress)
              expect(valid).toBeTruthy()
            },
            TEST_TIMEOUT_IN_MS
          )
        })
      })
    })
  })

  /**
   * These tests are entirely mocked for now
   */
  describe('asking for addresses validations', () => {
    beforeEach(() => {
      knownAddress = ACCOUNT_ADDRESS1
      otherAddress = ACCOUNT_ADDRESS2
    })

    describe('never', () => {
      beforeEach(() => {
        wallet = new LedgerWallet(undefined, undefined, {}, AddressValidation.never)
        mockForceValidation = jest.fn((): void => {
          // do nothing
        })
        mockLedger(wallet, mockForceValidation)
      })

      it("won't validate", async () => {
        await wallet.init()
        expect(mockForceValidation.mock.calls.length).toBe(0)
        await wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(0)
      })
    })

    describe('only in the initialization', () => {
      beforeEach(() => {
        wallet = new LedgerWallet(undefined, undefined, {}, AddressValidation.initializationOnly)
        mockForceValidation = jest.fn((): void => {
          // do nothing
        })
        mockLedger(wallet, mockForceValidation)
      })

      it('will validate the addresses only in the initialization', async () => {
        await wallet.init()
        expect(mockForceValidation.mock.calls.length).toBe(5)
        await wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(5)
      })
    })

    describe('every transaction', () => {
      beforeEach(() => {
        wallet = new LedgerWallet(undefined, undefined, {}, AddressValidation.everyTransaction)
        mockForceValidation = jest.fn((): void => {
          // do nothing
        })
        mockLedger(wallet, mockForceValidation)
      })

      it('will validate every transaction', async () => {
        await wallet.init()
        expect(mockForceValidation.mock.calls.length).toBe(0)
        await wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(1)
        await wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(2)
      })
    })

    describe('once per address', () => {
      beforeEach(() => {
        wallet = new LedgerWallet(
          undefined,
          undefined,
          {},
          AddressValidation.firstTransactionPerAddress
        )
        mockForceValidation = jest.fn((): void => {
          // do nothing
        })
        mockLedger(wallet, mockForceValidation)
      })

      it('will validate only in the first transaction of the address', async () => {
        await wallet.init()
        expect(mockForceValidation.mock.calls.length).toBe(0)
        await wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(1)
        await wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(1)
        await wallet.signPersonalMessage(otherAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(2)
        await wallet.signPersonalMessage(otherAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(2)
      })
    })

    describe('by default (acts as firstTransactionPerAddress)', () => {
      beforeEach(() => {
        wallet = new LedgerWallet()
        mockForceValidation = jest.fn((): void => {
          // do nothing
        })
        mockLedger(wallet, mockForceValidation)
      })

      it('will validate only in the first transaction of the address', async () => {
        await wallet.init()
        expect(mockForceValidation.mock.calls.length).toBe(0)
        await wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(1)
        await wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)
        expect(mockForceValidation.mock.calls.length).toBe(1)
      })
    })
  })
})
