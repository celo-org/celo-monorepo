import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
// @ts-ignore-next-line
import { account as Account } from 'eth-lib'
import Web3 from 'web3'
import { EncodedTransaction, Tx } from 'web3-core'
import { EIP712TypedData } from '../utils/sign-typed-data-utils'
import {
  chainIdTransformationForSigning,
  getHashFromEncoded,
  recoverTransaction,
} from '../utils/signing-utils'
import { LedgerWallet } from './ledger-wallet'

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

const ledgerAddreses: { [myKey: string]: { address: string; privateKey: string } } = {
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

describe('LedgerWallet class', () => {
  let wallet: LedgerWallet

  beforeEach(() => {
    wallet = new LedgerWallet()
    jest.spyOn<any, any>(wallet, 'generateNewLedger').mockImplementation((_transport: any) => {
      return {
        getAddress: async (derivationPath: string) => {
          if (ledgerAddreses[derivationPath]) {
            return { address: ledgerAddreses[derivationPath].address, derivationPath }
          }
          return {}
        },
        signTransaction: async (derivationPath: string, data: string) => {
          if (ledgerAddreses[derivationPath]) {
            const hash = getHashFromEncoded(ensureLeading0x(data))
            const signature = Account.makeSigner(chainIdTransformationForSigning(CHAIN_ID))(
              hash,
              ledgerAddreses[derivationPath].privateKey
            )
            const [v, r, s] = Account.decodeSignature(signature)
            return { v, r, s }
          }
          throw new Error('Invalid Path')
        },
        signPersonalMessage: async (derivationPath: string, data: string) => {
          if (ledgerAddreses[derivationPath]) {
            const hash = getHashFromEncoded(ensureLeading0x(data))
            const signature = Account.makeSigner(0)(hash, ledgerAddreses[derivationPath].privateKey)
            const [v, r, s] = Account.decodeSignature(signature)
            return { v: Number(v) + 27, r, s }
          }
          throw new Error('Invalid Path')
        },
      }
    })
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
      const typedData: EIP712TypedData = {
        types: { test: [{ name: 'test', type: 'string' }] },
        domain: { test: 'test' },
        message: { test: 'test' },
        primaryType: 'test',
      }
      await expect(wallet.signTypedData(ACCOUNT_ADDRESS1, typedData)).rejects.toThrowError()
    })
  })

  describe('after initializing', () => {
    beforeEach(async () => {
      await wallet.init()
    })

    test('starts 5 accounts', () => {
      expect(wallet.getAccounts().length).toBe(5)
    })

    test('returns true if it has the accounts', () => {
      expect(wallet.hasAccount(ACCOUNT_ADDRESS1)).toBeTruthy()
    })

    test('returns false if it has the accounts', () => {
      expect(wallet.hasAccount(ACCOUNT_ADDRESS_NEVER)).toBeFalsy()
    })

    describe('with an account', () => {
      const knownAddress = ACCOUNT_ADDRESS1
      const otherAddress = ACCOUNT_ADDRESS2

      describe('signing', () => {
        describe('using an unknown address', () => {
          const unknownAddress: string = ACCOUNT_ADDRESS_NEVER
          test('fails calling signTransaction', async () => {
            const txParams: Tx = {
              nonce: 1,
              gas: 'test',
              to: 'test',
              from: unknownAddress,
              chainId: CHAIN_ID,
            }
            await expect(wallet.signTransaction(txParams)).rejects.toThrowError()
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
        })

        describe('when calling signPersonalMessage', () => {
          test('succeds', async () => {
            const hexStr: string = ACCOUNT_ADDRESS_NEVER
            await expect(
              wallet.signPersonalMessage(knownAddress, hexStr)
            ).resolves.not.toBeUndefined()
          })

          test.todo('returns a valid sign')
        })
      })
    })
  })
})
