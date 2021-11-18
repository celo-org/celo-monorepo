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
import { ec as EC } from 'elliptic'
import * as ethUtil from 'ethereumjs-util'
import Web3 from 'web3'
import { GcpHsmWallet } from './gcp-hsm-wallet'
require('dotenv').config()

// Note: A lot of this test class was copied from the wallet-hsm-aws test since they work very similarly.

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

const USING_MOCK = typeof process.env.GCP_VERSION_NAME === 'undefined'
const MOCK_VERSION_NAME = '1d6db902-9a45-4dd5-bd1e-7250b2306f18'
const GCP_VERSION_NAME = USING_MOCK ? MOCK_VERSION_NAME : process.env.GCP_VERSION_NAME!

const key1 = PRIVATE_KEY1
const ec = new EC('secp256k1')

const keys: Map<string, string> = new Map([[MOCK_VERSION_NAME, key1]])

describe('GcpHsmWallet class', () => {
  let wallet: GcpHsmWallet
  let knownAddress: string
  const otherAddress: string = ACCOUNT_ADDRESS2

  beforeEach(async () => {
    wallet = new GcpHsmWallet(GCP_VERSION_NAME)
    if (USING_MOCK) {
      jest.spyOn<any, any>(wallet, 'generateKmsClient').mockImplementation((_transport: any) => {
        return {
          getPublicKey: async ({ name: versionName }: { name: string }) => {
            if (!keys.has(versionName)) {
              throw new Error(
                `3 INVALID_ARGUMENT: Resource name '${versionName}' does not match pattern some_pattern`
              )
            }
            const privateKey = keys.get(versionName)
            const pubKey = ethUtil.privateToPublic(ethUtil.toBuffer(privateKey))
            const temp = new BigNumber(ensureLeading0x(pubKey.toString('hex')))
            const asn1Key = asn1FromPublicKey(temp)
            const prefix = '-----BEGIN PUBLIC KEY-----\n'
            const postfix = '-----END PUBLIC KEY-----\n'
            const pem =
              prefix +
              asn1Key
                .toString('base64')
                .match(/.{0,64}/g)!
                .join('\n') +
              postfix
            return [{ pem }]
          },
          asymmetricSign: async ({
            name,
            digest,
          }: {
            name: string
            digest: { sha256: Buffer }
          }) => {
            const privateKey = trimLeading0x(keys.get(name)!)
            if (privateKey) {
              const pkBuffer = Buffer.from(privateKey, 'hex')
              const signature = ec.sign(digest.sha256, pkBuffer, { canonical: true })
              return [{ signature: Buffer.from(signature.toDER()) }]
            }
            throw new Error(`Unable to locate key: ${name}`)
          },
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
    const address = await wallet.getAddressFromVersionName(GCP_VERSION_NAME)
    expect(await wallet.hasAccount(address)).toBeTruthy()
  })

  test('throws on invalid key id', async () => {
    try {
      await wallet.getAddressFromVersionName('invalid')
      throw new Error('expected error to have been thrown')
    } catch (e: any) {
      expect(e.message).toContain(
        "3 INVALID_ARGUMENT: Resource name 'invalid' does not match pattern"
      )
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
          await wallet.getAddressFromVersionName(unknownKey)
          throw new Error('Expected exception to be thrown')
        } catch (e: any) {
          expect(e.message).toMatch(
            new RegExp(
              `3 INVALID_ARGUMENT: Resource name '${unknownKey}' does not match pattern .*`
            )
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
      const knownKey: string = GCP_VERSION_NAME!
      beforeEach(async () => {
        knownAddress = await wallet.getAddressFromVersionName(knownKey)
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
            from: await wallet.getAddressFromVersionName(knownKey),
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
