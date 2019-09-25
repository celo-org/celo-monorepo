import { privateToAddress } from 'ethereumjs-util'
import * as Web3Utils from 'web3-utils'
import { Signature, SignatureUtils } from './signatureUtils'

const privateKeyToAddress = (privateKey: string) => {
  return '0x' + privateToAddress(Buffer.from(privateKey.slice(2), 'hex')).toString('hex')
}

enum IdentifierType {
  PHONE_NUMBER,
}

function hashIdentifier(identifier: string, type: IdentifierType) {
  switch (type) {
    case IdentifierType.PHONE_NUMBER:
      return Web3Utils.soliditySha3({ type: 'string', value: identifier })
    default:
      return ''
  }
}

function attestationMessageToSign(identifier: string, account: string) {
  const messageHash: string = Web3Utils.soliditySha3(
    { type: 'bytes32', value: hashIdentifier(identifier, IdentifierType.PHONE_NUMBER) },
    { type: 'address', value: account }
  )
  return messageHash
}

export function attestToIdentifier(
  identifier: string,
  account: string,
  privateKey: string
): Signature {
  const issuer = privateKeyToAddress(privateKey)
  const { v, r, s } = SignatureUtils.signMessage(
    attestationMessageToSign(identifier, account),
    privateKey,
    issuer
  )
  return { v, r, s }
}
