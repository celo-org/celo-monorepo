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
    const typedData = JSON.parse(
      '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"}],"AttestationRequest":[{"name":"code","type":"string"}]},"primaryType":"AttestationRequest","domain":{"name":"Attestations","version":"1.0.0"},"message":{"code":"1000023"}}'
    )
    // generated via LocalWallet's signTypedData
    const rsvSignature =
      '0x106c6f892c5667c298dddc023161b58657c47fb03348fa0ec9b3b515841df47b39985d448104683fcef8d81f2cdcf8bce83c97f8dfb130438f7d26c6e3b2a10001'
    // generated via contractKit's signTypedData
    const vrsSignature =
      '0x1c106c6f892c5667c298dddc023161b58657c47fb03348fa0ec9b3b515841df47b39985d448104683fcef8d81f2cdcf8bce83c97f8dfb130438f7d26c6e3b2a100'
    const signature = {
      v: 28,
      r: '0x106c6f892c5667c298dddc023161b58657c47fb03348fa0ec9b3b515841df47b',
      s: '0x39985d448104683fcef8d81f2cdcf8bce83c97f8dfb130438f7d26c6e3b2a100',
    }
    // Modified 'v' from 1c -> 1b (28 -> 27)
    const invalidVrsSignature =
      '0x1b106c6f892c5667c298dddc023161b58657c47fb03348fa0ec9b3b515841df47b39985d448104683fcef8d81f2cdcf8bce83c97f8dfb130438f7d26c6e3b2a100'

    it('should recover signer from RSV-serialized sig of EIP712 typed data ', () => {
      const recoveredSigner = SignatureUtils.recoverEIP712TypedDataSignerRsv(
        typedData,
        rsvSignature
      )
      expect(signer.toLowerCase()).toEqual(recoveredSigner.toLowerCase())
    })
    it('should recover signer from VSR-serialized sig of EIP712 typed data', () => {
      const recoveredSigner = SignatureUtils.recoverEIP712TypedDataSignerVrs(
        typedData,
        vrsSignature
      )
      expect(signer.toLowerCase()).toEqual(recoveredSigner.toLowerCase())
    })
    it('should verify signer from RSV-serialized sig of EIP712 typed data', () => {
      expect(
        SignatureUtils.verifyEIP712TypedDataSigner(typedData, rsvSignature, signer)
      ).toBeTruthy()
    })
    it('should verify signer from VSR-serialized sig of EIP712 typed data', () => {
      expect(
        SignatureUtils.verifyEIP712TypedDataSigner(typedData, vrsSignature, signer)
      ).toBeTruthy()
    })
    it('should verify signer from serializeSignature output', () => {
      const serializedSig = SignatureUtils.serializeSignature(signature)
      expect(
        SignatureUtils.verifyEIP712TypedDataSigner(typedData, serializedSig, signer)
      ).toBeTruthy()
    })
    it('should not verify signer from invalid sig of EIP712 typed data', () => {
      expect(
        SignatureUtils.verifyEIP712TypedDataSigner(typedData, invalidVrsSignature, signer)
      ).toBeFalsy()
    })
  })
})
