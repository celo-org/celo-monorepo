import { eqAddress } from '@celo/base'
import { VerifiableCredentialUtils } from '@celo/utils'
import { VerifiableCredentialRequest } from '@celo/utils/lib/io'
import express from 'express'
import { useKit } from '../db'
import { getAccountAddress, getAttestationSignerAddress } from '../env'
import {
  ErrorWithResponse,
  respondWithError,
  respondWithVerifiableCredential,
  Response,
} from '../request'

export class VerifiableCredentialHandler {
  constructor(public readonly verifiableCredentialRequest: VerifiableCredentialRequest) {}

  async signVerifiableCredential(signingInput: string) {
    return await useKit((kit) =>
      kit.connection.sign(signingInput, getAttestationSignerAddress().toLowerCase())
    )
  }

  async validateRequest(issuer: string) {
    const address = getAccountAddress()
    if (!eqAddress(address, issuer)) {
      throw new ErrorWithResponse(`Mismatching issuer, I am ${address}`, 422)
    }
  }

  async doCredential(phoneNumberType: string, subject: string, issuer: string, identifier: string) {
    await this.validateRequest(issuer)

    const credential = VerifiableCredentialUtils.getPhoneNumberTypeJSONLD(
      phoneNumberType,
      subject.toLowerCase(),
      getAttestationSignerAddress().toLowerCase(),
      identifier
    )

    const proofOptions = VerifiableCredentialUtils.getProofOptions(
      getAttestationSignerAddress().toLowerCase()
    )

    const verifiableCredential = await VerifiableCredentialUtils.issueCredential(
      credential,
      proofOptions,
      async (signInput) => await this.signVerifiableCredential(signInput.ethereumPersonalMessage)
    )

    return JSON.parse(verifiableCredential)
  }
}

export async function handleVerifiableCredentialRequest(
  _req: express.Request,
  res: Response,
  vcRequest: VerifiableCredentialRequest
) {
  const handler = new VerifiableCredentialHandler(vcRequest)
  try {
    const { phoneNumberType, accountAddress, issuer, identifier } = vcRequest
    const verifiableCredential = await handler.doCredential(
      phoneNumberType,
      accountAddress,
      issuer,
      identifier
    )
    respondWithVerifiableCredential(res, verifiableCredential)
  } catch (error) {
    respondWithError(res, error.responseCode ?? 500, `${error.message ?? error}`)
  }
}
