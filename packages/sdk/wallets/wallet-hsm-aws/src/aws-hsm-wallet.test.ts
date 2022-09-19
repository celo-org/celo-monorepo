import { CeloTx, EncodedTransaction } from '@celo/connect'
import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
  trimLeading0x,
} from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { recoverTransaction, verifyEIP712TypedDataSigner } from '@celo/wallet-base'
import { asn1FromPublicKey } from '@celo/wallet-hsm'
import { BigNumber } from 'bignumber.js'
import * as ethUtil from 'ethereumjs-util'
import Web3 from 'web3'
import { AwsHsmWallet } from './aws-hsm-wallet'
require('dotenv').config()

export const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
export const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
export const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
export const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))

export const PRIVATE_KEY_NEVER =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890ffffff'
export const ACCOUNT_ADDRESS_NEVER = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY_NEVER))

export const CHAIN_ID = 44378

export const TYPED_DATA = {
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

const USING_MOCK = typeof process.env.AWS_HSM_KEY_ID === 'undefined'
const MOCK_KEY_ID = '1d6db902-9a45-4dd5-bd1e-7250b2306f18'
const AWS_HSM_KEY_ID = USING_MOCK ? MOCK_KEY_ID : process.env.AWS_HSM_KEY_ID

const key1 = PRIVATE_KEY1

const keys: Map<string, string> = new Map([[MOCK_KEY_ID, key1]])
const listKeysResponse = {
  Keys: Array.from(keys.keys()).map((id) => ({
    KeyId: id,
    Enabled: true,
  })),
  Truncated: false,
}

describe('AwsHsmWallet class', () => {
  let wallet: AwsHsmWallet
  let knownAddress: string
  const otherAddress: string = ACCOUNT_ADDRESS2

  beforeEach(async () => {
    wallet = new AwsHsmWallet()
    if (USING_MOCK) {
      jest.spyOn<any, any>(wallet, 'generateKmsClient').mockImplementation((_transport: any) => {
        return {
          listKeys: () => ({
            promise: () => Promise.resolve(listKeysResponse),
          }),
          describeKey: ({ KeyId }: { KeyId: string }) => ({
            promise: () =>
              Promise.resolve({
                KeyMetadata: {
                  AWSAccountId: 'AWSAccountId',
                  KeyId,
                  Enabled: true,
                  Description: '',
                  KeyUsage: 'SIGN_VERIFY',
                  KeyState: 'Enabled',
                  Origin: 'AWS_KMS',
                  KeyManager: 'CUSTOMER',
                  CustomerMasterKeySpec: 'ECC_SECG_P256K1',
                  SigningAlgorithms: ['ECDSA_SHA_256'],
                },
              }),
          }),
          getPublicKey: ({ KeyId }: { KeyId: string }) => ({
            promise: async () => {
              const isGuid =
                /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/
              if (!KeyId.match(isGuid)) {
                throw new Error(`Invalid keyId ${KeyId}`)
              }
              if (!keys.has(KeyId)) {
                throw new Error(`Key 'arn:aws:kms:123:key/${KeyId}' does not exist`)
              }
              const privateKey = keys.get(KeyId)
              const pubKey = ethUtil.privateToPublic(ethUtil.toBuffer(privateKey))
              const temp = new BigNumber(ensureLeading0x(pubKey.toString('hex')))
              const asn1Key = asn1FromPublicKey(temp)
              return { PublicKey: new Uint8Array(asn1Key) }
            },
          }),
          sign: ({ KeyId, Message }: { KeyId: string; Message: Buffer }) => ({
            promise: () => {
              const privateKey = trimLeading0x(keys.get(KeyId)!)
              if (privateKey) {
                const pkBuffer = Buffer.from(privateKey, 'hex')
                // NOTE: elliptic is disabled elsewhere in this library to prevent
                // accidental signing of truncated messages.
                // tslint:disable-next-line:import-blacklist
                const EC = require('elliptic').ec
                const ec = new EC('secp256k1')
                const signature = ec.sign(Message, pkBuffer, { canonical: true })
                return { Signature: Buffer.from(signature.toDER()) }
              }
              throw new Error(`Unable to locate key: ${KeyId}`)
            },
          }),
        }
      })
    }

    await wallet.init()
  })

  test('hasAccount should return false for keys that are not present', async () => {
    expect(await wallet.hasAccount('this is not a valid private key')).toBeFalsy()
  })

  test('hasAccount should return true for keys that are present', async () => {
    // Valid key should be present
    const address = await wallet.getAddressFromKeyId(AWS_HSM_KEY_ID!)
    expect(await wallet.hasAccount(address)).toBeTruthy()
  })

  test('throws on invalid key id', async () => {
    try {
      await wallet.getAddressFromKeyId('invalid')
      throw new Error('expected error to have been thrown')
    } catch (e: any) {
      expect(e.message).toBe('Invalid keyId invalid')
    }
  })

  describe('signing', () => {
    let celoTransaction: CeloTx
    const unknownKey: string = '00000000-0000-0000-0000-000000000000'
    const unknownAddress = ACCOUNT_ADDRESS_NEVER

    describe('using an unknown key', () => {
      beforeEach(async () => {
        celoTransaction = {
          from: unknownAddress,
          to: otherAddress,
          chainId: CHAIN_ID,
          value: Web3.utils.toWei('1', 'ether'),
          nonce: 0,
          gas: '10',
          gasPrice: '99',
          feeCurrency: '0x',
          gatewayFeeRecipient: ACCOUNT_ADDRESS_NEVER,
          gatewayFee: '0x5678',
          data: '0xabcdef',
        }
      })

      test('fails getting address from key', async () => {
        try {
          await wallet.getAddressFromKeyId(unknownKey)
          throw new Error('Expected exception to be thrown')
        } catch (e: any) {
          expect(e.message).toMatch(
            new RegExp(`Key 'arn:aws:kms:.*:key/${unknownKey}' does not exist`)
          )
        }
      })

      test('fails calling signTransaction', async () => {
        try {
          await wallet.signTransaction(celoTransaction)
          throw new Error('Expected exception to be thrown')
        } catch (e: any) {
          expect(e.message).toBe(`Could not find address ${unknownAddress}`)
        }
      })

      test('fails calling signPersonalMessage', async () => {
        const hexStr: string = '0xa1'
        try {
          await wallet.signPersonalMessage(unknownAddress, hexStr)
          throw new Error('Expected exception to be thrown')
        } catch (e: any) {
          expect(e.message).toBe(`Could not find address ${unknownAddress}`)
        }
      })

      test('fails calling signTypedData', async () => {
        try {
          await wallet.signTypedData(unknownAddress, TYPED_DATA)
          throw new Error('Expected exception to be thrown')
        } catch (e: any) {
          expect(e.message).toBe(`Could not find address ${unknownAddress}`)
        }
      })
    })

    describe('using a known key', () => {
      const knownKey: string = AWS_HSM_KEY_ID!
      beforeEach(async () => {
        knownAddress = await wallet.getAddressFromKeyId(knownKey)
        celoTransaction = {
          from: knownAddress,
          to: otherAddress,
          chainId: CHAIN_ID,
          value: Web3.utils.toWei('1', 'ether'),
          nonce: 0,
          gas: '10',
          gasPrice: '99',
          feeCurrency: '0x',
          gatewayFeeRecipient: ACCOUNT_ADDRESS_NEVER,
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
          expect(normalizeAddressWith0x(recoveredSigner)).toBe(normalizeAddressWith0x(knownAddress))
        })
        // https://github.com/ethereum/go-ethereum/blob/38aab0aa831594f31d02c9f02bfacc0bef48405d/rlp/decode.go#L664
        test('signature with 0x00 prefix is canonicalized', async () => {
          // This tx is carefully constructed to produce an S value with the first byte as 0x00
          const celoTransactionZeroPrefix = {
            from: await wallet.getAddressFromKeyId(knownKey),
            to: ACCOUNT_ADDRESS2,
            chainId: CHAIN_ID,
            value: Web3.utils.toWei('1', 'ether'),
            nonce: 65,
            gas: '10',
            gasPrice: '99',
            feeCurrency: '0x',
            gatewayFeeRecipient: ACCOUNT_ADDRESS_NEVER,
            gatewayFee: '0x5678',
            data: '0xabcdef',
          }
          const signedTx: EncodedTransaction = await wallet.signTransaction(
            celoTransactionZeroPrefix
          )
          expect(signedTx.tx.s.startsWith('0x00')).toBeFalsy()
          const [, recoveredSigner] = recoverTransaction(signedTx.raw)
          expect(normalizeAddressWith0x(recoveredSigner)).toBe(normalizeAddressWith0x(knownAddress))
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
