import { VerifiableCredentialRequest } from '@celo/utils/lib/io'
import { completeIssueCredential, prepareIssueCredential, verifyCredential } from 'didkit-wasm-node'
import express from 'express'
import { useKit } from '../db'
import { getAttestationSignerAddress } from '../env'
import { respondWithError, respondWithVerifiableCredential, Response } from '../request'

function fromBase64(base64: string): string {
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
export class VerifiableCredentialHandler {
  constructor(public readonly verifiableCredentialRequest: VerifiableCredentialRequest) {}

  getJSONLDObject(phoneType: string, accountAddress: string) {
    return JSON.stringify({
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        {
          phoneType: 'https://docs.celo.org/phone_types',
          PhoneNumberType: 'https://docs.celo.org/PhoneNumberType',
        },
      ],
      type: ['VerifiableCredential', 'PhoneNumberType'],
      credentialSubject: {
        id: `did:celo:${accountAddress}`,
        phoneType: phoneType,
      },
      issuanceDate: new Date().toISOString(),
      issuer: `did:celo:${getAttestationSignerAddress()}`,
    })
  }

  getProofOptions() {
    return JSON.stringify({
      verificationMethod: `did:celo:${getAttestationSignerAddress()}#Recovery2020`,
      proofPurpose: 'assertionMethod',
    })
  }

  async signVerifiableCredential(signingInput: string) {
    return await useKit((kit) => kit.connection.sign(signingInput, getAttestationSignerAddress()))
  }

  async issueCredential(phoneType: string, accountAddress: string): Promise<string> {
    const credential = this.getJSONLDObject(phoneType, accountAddress)
    const proofOptions = this.getProofOptions()

    const prepCredential = JSON.parse(
      await prepareIssueCredential(
        credential,
        proofOptions,
        JSON.stringify({
          kty: 'EC',
          crv: 'secp256k1',
          alg: 'ES256K-R',
        })
      )
    )

    const signature = await this.signVerifiableCredential(prepCredential.signingInput)

    const b64signature = Buffer.from(signature.substring(2), 'hex').toString('base64')

    let vc = await completeIssueCredential(
      credential,
      JSON.stringify(prepCredential),
      fromBase64(b64signature)
    )

    const verifyOptionsString = '{}'
    const verifyResult = await verifyCredential(vc, verifyOptionsString)
    const result = JSON.parse(verifyResult)

    // Check for errors
    if (result.errors.length > 0) {
      throw new Error(result.errors)
    }
    return await vc
  }

  async doCredential(phoneType: string, accountAddress: string) {
    return JSON.parse(await this.issueCredential(phoneType, accountAddress))
  }
}

export async function handleVerifiableCredentialRequest(
  _req: express.Request,
  res: Response,
  vcRequest: VerifiableCredentialRequest
) {
  const handler = new VerifiableCredentialHandler(vcRequest)
  try {
    const { phoneType, accountAddress } = vcRequest
    const verifiableCredential = await handler.doCredential(phoneType, accountAddress)
    respondWithVerifiableCredential(res, verifiableCredential)
  } catch (error) {
    respondWithError(res, error.responseCode ?? 500, `${error.message ?? error}`)
  }
}
