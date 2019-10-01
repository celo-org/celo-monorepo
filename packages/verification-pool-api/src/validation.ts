import { newKit } from '@celo/contractkit'
import * as ethjsutil from 'ethereumjs-util'

const kit = newKit('https://integration-infura.celo-testnet.org')

export function parseBase64(source: string) {
  return ethjsutil.bufferToHex(Buffer.from(source, 'base64'))
}

export async function validateRequest(
  phoneNumber: string,
  account: string,
  message: string,
  issuer: string
) {
  try {
    const attestations = await kit.contracts.getAttestations()
    return await attestations.validateAttestationCode(phoneNumber, account, issuer, message)
  } catch (e) {
    console.error('Error validating attestation', e)
    return false
  }
}
