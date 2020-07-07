import { ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import { BigNumber } from 'bignumber.js'
import * as ethUtil from 'ethereumjs-util'
import Web3 from 'web3'
import { Tx } from 'web3-core'
import AwsHsmWallet from './aws-hsm-wallet'
import {
  ACCOUNT_ADDRESS1,
  ACCOUNT_ADDRESS2,
  ACCOUNT_ADDRESS_NEVER,
  CHAIN_ID,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  TYPED_DATA,
} from './test-utils'

// const mockSignResponse = {
//   KeyId,
//   Signature: Buffer.from(
//     'MEQCIFiTzjBKbx90pkEr3XfFPug8ECWy3sCVPMlt8Rv4i4IdAiBxdxqF59JvAfFnFqfRtu9xHOyoaEafZ6M6dgVtKkAIDg==',
//     'base64'
//   ),
//   SigningAlgorithm: 'ECDSA_SHA_256',
// }

// const mockGetPublicKeyResponse = {
//   KeyId,
//   PublicKey: Buffer.from(
//     'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEkl6JouLgmbQI+p/vc7yWOViLOsh95JdmS9wnWY2lJkb9XS7hsswNsv1kp9YwBpuMXjFftctGyKoUkZtsT1y9pQ==',
//     'base64'
//   ),
//   CustomerMasterKeySpec: 'ECC_SECG_P256K1',
//   KeyUsage: 'SIGN_VERIFY',
//   SigningAlgorithms: ['ECDSA_SHA_256'],
// }

const USING_MOCK = typeof process.env.AWS_HSM_KEY_ID === 'undefined'
const AWS_HSM_KEY_ID = USING_MOCK ? 'secp' : process.env.AWS_HSM_KEY_ID
const keys: Map<string, { address: string; privateKey: string }> = new Map([
  [
    'secp',
    {
      address: ACCOUNT_ADDRESS1,
      privateKey: PRIVATE_KEY1,
    },
  ],
  [
    'secp2',
    {
      address: ACCOUNT_ADDRESS2,
      privateKey: PRIVATE_KEY2,
    },
  ],
])
const listKeysResponse = {
  Keys: Array.from(keys.keys()).map((id) => ({
    KeyId: id,
    Enabled: true,
  })),
  Truncated: false,
}

describe('AwsHsmWallet class', () => {
  let wallet: AwsHsmWallet
  // @ts-ignore
  let knownAddress: string
  // @ts-ignore
  let otherAddress: string

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
            promise: () => {
              if (!keys.has(KeyId)) {
                throw new Error('f')
              }
              const privKey = keys.get(KeyId)!.privateKey
              const pubKey = ethUtil.privateToPublic(ethUtil.toBuffer(privKey))
              return new BigNumber(ensureLeading0x(pubKey.toString('hex')))
            },
          }),
          sign: ({ KeyId, Message }: { KeyId: string; Message: Buffer }) => ({
            promise: () => {
              if (keys.has(KeyId)) {
                const trimmedKey = trimLeading0x(keys.get(KeyId)!.privateKey)
                const pkBuffer = Buffer.from(trimmedKey, 'hex')
                const signature = ethUtil.ecsign(Message, pkBuffer)
                // Azure HSM doesn't add the byte prefix (+27) while ecsign does
                // Subtract 27 to properly mock the HSM signer
                return { v: signature.v - 27, r: signature.r, s: signature.s }
              }
              throw new Error(`Unable to locate key: ${KeyId}`)
            },
          }),
        }
      })
    }

    await wallet.init()
    if (USING_MOCK) {
      knownAddress = ACCOUNT_ADDRESS1
      otherAddress = ACCOUNT_ADDRESS_NEVER
    } else {
      ;[knownAddress, otherAddress] = wallet.getAccounts()
    }
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
    } catch (e) {
      expect(e.message).toBe('Invalid keyId invalid')
    }
  })

  describe('signing', () => {
    let celoTransaction: Tx
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
          gatewayFeeRecipient: '0x1234',
          gatewayFee: '0x5678',
          data: '0xabcdef',
        }
      })

      test('fails getting address from key', async () => {
        try {
          await wallet.getAddressFromKeyId(unknownKey)
          throw new Error('Expected exception to be thrown')
        } catch (e) {
          expect(e.message).toMatch(
            new RegExp(`Key 'arn:aws:kms:.*:key/${unknownKey}' does not exist`)
          )
        }
      })

      test('fails calling signTransaction', async () => {
        try {
          await wallet.signTransaction(celoTransaction)
          throw new Error('Expected exception to be thrown')
        } catch (e) {
          expect(e.message).toBe(`Could not find address ${unknownAddress}`)
        }
      })

      test('fails calling signPersonalMessage', async () => {
        const hexStr: string = '0xa1'
        try {
          await wallet.signPersonalMessage(unknownAddress, hexStr)
          throw new Error('Expected exception to be thrown')
        } catch (e) {
          expect(e.message).toBe(`Could not find address ${unknownAddress}`)
        }
      })

      test('fails calling signTypedData', async () => {
        try {
          await wallet.signTypedData(unknownAddress, TYPED_DATA)
          throw new Error('Expected exception to be thrown')
        } catch (e) {
          expect(e.message).toBe(`Could not find address ${unknownAddress}`)
        }
      })
    })

    //   describe('using a known key', () => {
    //     let celoTransaction: Tx
    //     const knownKey: string = AZURE_KEY_NAME!
    //     let knownAddress: Address
    //     const otherAddress: string = ACCOUNT_ADDRESS2
    //     beforeEach(async () => {
    //       knownAddress = await wallet.getAddressFromKeyName(knownKey)
    //       celoTransaction = {
    //         from: knownAddress,
    //         to: otherAddress,
    //         chainId: CHAIN_ID,
    //         value: Web3.utils.toWei('1', 'ether'),
    //         nonce: 0,
    //         gas: '10',
    //         gasPrice: '99',
    //         feeCurrency: '0x',
    //         gatewayFeeRecipient: '0x1234',
    //         gatewayFee: '0x5678',
    //         data: '0xabcdef',
    //       }
    //     })

    //     describe('when calling signTransaction', () => {
    //       test('succeeds', async () => {
    //         const signedTx: EncodedTransaction = await wallet.signTransaction(celoTransaction)
    //         expect(signedTx).not.toBeUndefined()
    //       })
    //       test('with same signer', async () => {
    //         const signedTx: EncodedTransaction = await wallet.signTransaction(celoTransaction)
    //         const [, recoveredSigner] = recoverTransaction(signedTx.raw)
    //         expect(normalizeAddressWith0x(recoveredSigner)).toBe(normalizeAddressWith0x(knownAddress))
    //       })
    //       // https://github.com/ethereum/go-ethereum/blob/38aab0aa831594f31d02c9f02bfacc0bef48405d/rlp/decode.go#L664
    //       test('signature with 0x00 prefix is canonicalized', async () => {
    //         // This tx is carefully constructed to produce an S value with the first byte as 0x00
    //         const celoTransactionZeroPrefix = {
    //           from: await wallet.getAddressFromKeyId(knownKey),
    //           to: ACCOUNT_ADDRESS2,
    //           chainId: CHAIN_ID,
    //           value: Web3.utils.toWei('1', 'ether'),
    //           nonce: 65,
    //           gas: '10',
    //           gasPrice: '99',
    //           feeCurrency: '0x',
    //           gatewayFeeRecipient: '0x1234',
    //           gatewayFee: '0x5678',
    //           data: '0xabcdef',
    //         }
    //         const signedTx: EncodedTransaction = await wallet.signTransaction(
    //           celoTransactionZeroPrefix
    //         )
    //         expect(signedTx.tx.s.startsWith('0x00')).toBeFalsy()
    //         const [, recoveredSigner] = recoverTransaction(signedTx.raw)
    //         expect(normalizeAddressWith0x(recoveredSigner)).toBe(normalizeAddressWith0x(knownAddress))
    //       })
    //     })
    //     describe('when calling signPersonalMessage', () => {
    //       test('succeeds', async () => {
    //         const hexStr: string = ACCOUNT_ADDRESS1
    //         const signedMessage = await wallet.signPersonalMessage(knownAddress, hexStr)
    //         expect(signedMessage).not.toBeUndefined()
    //         const valid = verifySignature(hexStr, signedMessage, knownAddress)
    //         expect(valid).toBeTruthy()
    //       })
    //     })
    //     describe('when calling signTypedData', () => {
    //       test('succeeds', async () => {
    //         const signedMessage = await wallet.signTypedData(knownAddress, TYPED_DATA)
    //         expect(signedMessage).not.toBeUndefined()
    //         const valid = verifyEIP712TypedDataSigner(TYPED_DATA, signedMessage, knownAddress)
    //         expect(valid).toBeTruthy()
    //       })
    //     })
    //   })
  })
})
