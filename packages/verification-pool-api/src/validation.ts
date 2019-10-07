import { newKitFromWeb3 } from '@celo/contractkit'
import * as ethjsutil from 'ethereumjs-util'
import { web3 } from './config'

const kit = newKitFromWeb3(web3)

export function parseBase64(source: string) {
  return ethjsutil.bufferToHex(Buffer.from(source, 'base64'))
}

export async function validateRequest(
  identifier: string,
  account: string,
  message: string,
  issuer: string
) {
  try {
    const attestations = await kit.contracts.getAttestations()
    return await attestations.validateAttestationCode(identifier, account, issuer, message)
  } catch (e) {
    console.error('Error validating attestation', e)
    return false
  }
}
