import * as Web3Utils from 'web3-utils'
import { privateKeyToAddress } from './address'
import { IdentityUtils } from './identity'
import { Signature, SignatureUtils } from './signatureUtils'

export async function attestationMessageToSign(identifier: string, account: string) {
  const messageHash: string = Web3Utils.soliditySha3(
    {
      type: 'bytes32',
      value: await IdentityUtils.identityHash(
        identifier,
        IdentityUtils.IdentifierTypeEnum.PHONE_NUMBER
      ),
    },
    { type: 'address', value: account }
  )
  return messageHash
}

export async function attestToIdentifier(
  identifier: string,
  account: string,
  privateKey: string
): Promise<Signature> {
  const issuer = privateKeyToAddress(privateKey)
  const { v, r, s } = SignatureUtils.signMessage(
    await attestationMessageToSign(identifier, account),
    privateKey,
    issuer
  )
  return { v, r, s }
}
