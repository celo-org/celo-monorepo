import { AttestationServiceStatusResponseType, SignatureType } from '@celo/utils/lib/io'
import express from 'express'
import * as t from 'io-ts'
import { kit } from '../db'
import { getAccountAddress, getAttestationSignerAddress } from '../env'
import { ErrorMessages, respondWithError } from '../request'
import { blacklistRegionCodes, configuredSmsProviders } from '../sms'

export const SIGNATURE_PREFIX = 'attestation-service-status-signature:'
export const StatusRequestType = t.type({
  messageToSign: t.union([SignatureType, t.undefined]),
})

export type StatusRequest = t.TypeOf<typeof StatusRequestType>

function produceSignature(message: string | undefined) {
  if (!message) {
    return undefined
  }

  return kit.web3.eth.sign(SIGNATURE_PREFIX + message, getAttestationSignerAddress())
}

export async function handleStatusRequest(
  _req: express.Request,
  res: express.Response,
  statusRequest: StatusRequest
) {
  try {
    res
      .json(
        AttestationServiceStatusResponseType.encode({
          status: 'ok',
          smsProviders: configuredSmsProviders(),
          blacklistedRegionCodes: blacklistRegionCodes(),
          accountAddress: getAccountAddress(),
          signature: await produceSignature(statusRequest.messageToSign),
        })
      )
      .status(200)
  } catch (error) {
    console.error(error)
    respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}
