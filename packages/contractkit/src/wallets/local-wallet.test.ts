import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'
import { EncodedTransaction, Tx } from 'web3-core'
import { recoverTransaction, verifyEIP712TypedDataSigner } from '../utils/signing-utils'
import { LocalWallet } from './local-wallet'

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
      throw new Error('Expected exception to be thrown')
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
        let celoTransaction: Tx
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
            feeCurrency: '0x124356',
            gatewayFeeRecipient: '0x1234',
            gatewayFee: '0x5678',
            data: '0xabcdef',
          }
        })

        test('fails calling signTransaction', async () => {
          await expect(wallet.signTransaction(celoTransaction)).rejects.toThrowError()
        })

        test('fails calling signPersonalMessage', async () => {
          const hexStr: string = '0xa1'
          await expect(wallet.signPersonalMessage(unknownAddress, hexStr)).rejects.toThrowError()
        })

        test('fails calling signTypedData', async () => {
          await expect(wallet.signTypedData(unknownAddress, TYPED_DATA)).rejects.toThrowError()
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
              feeCurrency: '0x',
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
