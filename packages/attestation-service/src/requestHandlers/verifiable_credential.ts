import { eqAddress } from '@celo/base'
import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { VerifiableCredentialRequest } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import { findAttestationByKey, useKit } from '../db'
import { getAccountAddress, getAttestationSignerAddress } from '../env'
import { issueAttestationPhoneNumberTypeCredential } from '../lookup'
import {
  ErrorWithResponse,
  respondWithError,
  respondWithVerifiableCredential,
  Response,
} from '../request'

export class VerifiableCredentialHandler {
  constructor(public readonly verifiableCredentialRequest: VerifiableCredentialRequest) {} // TODO(Alec): what's the point of this?

  async signVerifiableCredential(signingInput: string) {
    // TODO(Alec): where is this used?
    return useKit((kit) =>
      kit.connection.sign(signingInput, getAttestationSignerAddress().toLowerCase())
    )
  }

  validateRequest(issuer: string, issuers: string[]) {
    const address = getAccountAddress()
    if (!eqAddress(address, issuer)) {
      throw new ErrorWithResponse(`Mismatching issuer, I am ${address}`, 422)
    }

    if (!issuers.includes(issuer)) {
      throw new ErrorWithResponse(`I am not an authorized issuer for this account`, 422)
    }
  }

  async doCredential(account: string, issuer: string, identifier: string, logger: Logger) {
    const attestations = await useKit((kit) => kit.contracts.getAttestations())

    // Checks if the attestation service is an authorized issuer
    this.validateRequest(issuer, await attestations.getAttestationIssuers(identifier, account))

    const state = await attestations.getAttestationState(identifier, account, issuer)

    // Checks if the attestation is marked as completed
    if (state.attestationState !== AttestationState.Complete) {
      throw new ErrorWithResponse(`Can't issue a credential for an incomplete attestation`, 422)
    } // TODO(Alec): Does this happen before the attestation completes?

    const attestation = await findAttestationByKey({
      identifier,
      issuer,
      account,
    })

    if (!attestation) {
      throw new Error('Unable to find attestation in db')
    }

    return JSON.parse(await issueAttestationPhoneNumberTypeCredential(attestation, logger))
  }
}

export async function handleVerifiableCredentialRequest(
  _req: express.Request,
  res: Response,
  vcRequest: VerifiableCredentialRequest
) {
  const handler = new VerifiableCredentialHandler(vcRequest)
  try {
    const { account, issuer, identifier } = vcRequest
    const verifiableCredential = await handler.doCredential(
      account,
      issuer,
      identifier,
      res.locals.logger
    )
    respondWithVerifiableCredential(res, verifiableCredential)
  } catch (error) {
    respondWithError(res, error.responseCode ?? 500, `${error.message ?? error}`)
  }
}
