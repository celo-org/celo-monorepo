import Web3 from 'web3'
import * as Web3Utils from 'web3-utils'
import { SignatureUtils } from './signatureUtils'

const privateKeyToAddress = (privateKey: string) => {
  // @ts-ignore
  return new Web3.modules.Eth().accounts.privateKeyToAccount(privateKey).address
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

export function attestToIdentifier(identifier: string, account: string, privateKey: string) {
  const issuer = privateKeyToAddress(privateKey)
  const { v, r, s } = SignatureUtils.signMessage(
    attestationMessageToSign(identifier, account),
    privateKey,
    issuer
  )
  return { v, r, s }
}
