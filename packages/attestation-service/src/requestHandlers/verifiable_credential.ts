import { VerifiableCredentialUtils } from '@celo/utils'
import { VerifiableCredentialRequest } from '@celo/utils/lib/io'
import express from 'express'
import { useKit } from '../db'
import { getAccountAddress } from '../env'
import { respondWithError, respondWithVerifiableCredential, Response } from '../request'

export class VerifiableCredentialHandler {
  constructor(public readonly verifiableCredentialRequest: VerifiableCredentialRequest) {}

  async signVerifiableCredential(signingInput: string) {
    return await useKit((kit) => kit.connection.sign(signingInput, getAccountAddress()))
  }

  async doCredential(phoneNumberType: string, subject: string) {
    const credential = VerifiableCredentialUtils.getPhoneNumberTypeJSONLD(
      phoneNumberType,
      subject,
      getAccountAddress()
    )

    const proofOptions = VerifiableCredentialUtils.getProofOptions(getAccountAddress())

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
    const { phoneNumberType, accountAddress } = vcRequest
    const verifiableCredential = await handler.doCredential(phoneNumberType, accountAddress)
    respondWithVerifiableCredential(res, verifiableCredential)
  } catch (error) {
    respondWithError(res, error.responseCode ?? 500, `${error.message ?? error}`)
  }
}
