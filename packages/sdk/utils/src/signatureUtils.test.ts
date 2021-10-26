import * as Web3Utils from 'web3-utils'
import { privateKeyToAddress } from './address'
import {
  parseSignature,
  parseSignatureWithoutPrefix,
  serializeSignature,
  SignatureUtils,
  signMessage,
  signMessageWithoutPrefix,
} from './signatureUtils'
import { attestationSecurityCode } from './typed-data-constructors'

describe('signatures', () => {
  it('should sign appropriately with a hash of a message', () => {
    const pKey = '0x62633f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2'
    const address = privateKeyToAddress(pKey)
    const messageHash = Web3Utils.soliditySha3({ type: 'string', value: 'identifier' })!
    const signature = signMessageWithoutPrefix(messageHash, pKey, address)
    const serializedSig = serializeSignature(signature)
    parseSignatureWithoutPrefix(messageHash, serializedSig, address)
  })

  it('should sign appropriately with just the message', () => {
    const pKey = '0x62633f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2'
    const address = privateKeyToAddress(pKey)
    const message = 'mymessage'
    const signature = signMessage(message, pKey, address)
    const serializedSig = serializeSignature(signature)
    parseSignature(message, serializedSig, address)
  })

  describe('EIP712 signatures', () => {
    const pKey = '0xac8ca7aeb0f57f1ed1ce98a695dabcb0278faf03d68e1bae08c9095355a28b06'
    const signer = privateKeyToAddress(pKey)
    const typedData = attestationSecurityCode('1000023')

    it('should recover signer from RSV-serialized sig of EIP712 typed data ', () => {
      // generated via LocalWallet's signTypedData
      const rsvSignature =
        '0x106c6f892c5667c298dddc023161b58657c47fb03348fa0ec9b3b515841df47b39985d448104683fcef8d81f2cdcf8bce83c97f8dfb130438f7d26c6e3b2a10001'
      const recoveredSigner = SignatureUtils.recoverEIP712TypedDataSigner(
        typedData,
        rsvSignature,
        signer
      )
      expect(signer.toLowerCase()).toEqual(recoveredSigner.toLowerCase())
    })
    it('should recover signer from VSR-serialized sig of EIP712 typed data', () => {
      // generated via contractKit's signTypedData
      const vrsSignature =
        '0x1c106c6f892c5667c298dddc023161b58657c47fb03348fa0ec9b3b515841df47b39985d448104683fcef8d81f2cdcf8bce83c97f8dfb130438f7d26c6e3b2a100'
      const recoveredSigner = SignatureUtils.recoverEIP712TypedDataSigner(
        typedData,
        vrsSignature,
        signer
      )
      expect(signer.toLowerCase()).toEqual(recoveredSigner.toLowerCase())
    })
    it('should recover signer from serializeSignature output', () => {
      const signature = {
        v: 28,
        r: '0x106c6f892c5667c298dddc023161b58657c47fb03348fa0ec9b3b515841df47b',
        s: '0x39985d448104683fcef8d81f2cdcf8bce83c97f8dfb130438f7d26c6e3b2a100',
      }
      const serializedSig = SignatureUtils.serializeSignature(signature)
      const recoveredSigner = SignatureUtils.recoverEIP712TypedDataSigner(
        typedData,
        serializedSig,
        signer
      )
      expect(signer.toLowerCase()).toEqual(recoveredSigner.toLowerCase())
    })
    it('should verify signer from sig of EIP712 typed data', () => {
      // generated via contractKit's signTypedData
      const vrsSignature =
        '0x1c106c6f892c5667c298dddc023161b58657c47fb03348fa0ec9b3b515841df47b39985d448104683fcef8d81f2cdcf8bce83c97f8dfb130438f7d26c6e3b2a100'
      expect(
        SignatureUtils.verifyEIP712TypedDataSigner(typedData, vrsSignature, signer)
      ).toBeTruthy()
    })
    it('should not verify signer from invalid sig of EIP712 typed data', () => {
      // Modified 'v' from 1c -> 1b (28 -> 27)
      const invalidSignature =
        '0x1b106c6f892c5667c298dddc023161b58657c47fb03348fa0ec9b3b515841df47b39985d448104683fcef8d81f2cdcf8bce83c97f8dfb130438f7d26c6e3b2a100'
      expect(
        SignatureUtils.verifyEIP712TypedDataSigner(typedData, invalidSignature, signer)
      ).toBeFalsy()
    })
  })
})
