import { newKit } from '@celo/contractkit'
import { attestationSecurityCode } from '@celo/utils/lib/typed-data-constructors'
import { LocalWallet } from '@celo/wallet-local'
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

  it('should recover signer from RSV-serialized sig of EIP712 typed data ', async () => {
    const pKey = '0xac8ca7aeb0f57f1ed1ce98a695dabcb0278faf03d68e1bae08c9095355a28b06'
    const wallet = new LocalWallet()
    wallet.addAccount(pKey)
    const typedData = attestationSecurityCode('1000023')
    const signer = wallet.getAccounts()[0]
    // returns RSV-serialized signature
    const signature = await wallet.signTypedData(signer, typedData)
    const recoveredSigner = SignatureUtils.recoverEIP712TypedDataSigner(
      typedData,
      signature,
      signer
    )
    expect(signer.toLowerCase()).toEqual(recoveredSigner.toLowerCase())
  })

  it('should recover signer from VSR-serialized sig of EIP712 typed data', async () => {
    const pKey = '0xac8ca7aeb0f57f1ed1ce98a695dabcb0278faf03d68e1bae08c9095355a28b06'
    const wallet = new LocalWallet()
    wallet.addAccount(pKey)
    const kit = newKit('https://alfajores-forno.celo-testnet.org', wallet)
    const typedData = attestationSecurityCode('1000023')
    const signer = wallet.getAccounts()[0]
    // returns raw signature
    const signature = await kit.signTypedData(signer, typedData)
    // serializes to VRS-serialized signature
    const serializedSig = SignatureUtils.serializeSignature(signature)
    const recoveredSigner = SignatureUtils.recoverEIP712TypedDataSigner(
      typedData,
      serializedSig,
      signer
    )
    expect(signer.toLowerCase()).toEqual(recoveredSigner.toLowerCase())
  })
})
