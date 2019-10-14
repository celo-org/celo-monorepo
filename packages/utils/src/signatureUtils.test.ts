import * as Web3Utils from 'web3-utils'
import { privateKeyToAddress } from './address'
import { parseSignature, serializeSignature, signMessage } from './signatureUtils'

describe('signatures', () => {
  it('should sign appropriately', () => {
    const pKey = '0x62633f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2'
    const address = privateKeyToAddress(pKey)
    const message = Web3Utils.soliditySha3({ type: 'string', value: 'identifier' })
    const signature = signMessage(message, pKey, address)
    const serializedSig = serializeSignature(signature)
    parseSignature(message, '0x' + serializedSig, address)
  })
})
