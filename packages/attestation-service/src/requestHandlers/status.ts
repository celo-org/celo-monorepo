import { privateKeyToAddress } from '@celo/utils/lib/address'
import { AttestationServiceStatusResponseType, SignatureType } from '@celo/utils/lib/io'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import express from 'express'
import * as t from 'io-ts'
import { ErrorMessages, respondWithError } from '../request'
import { blacklistRegionCodes, configuredSmsProviders } from '../sms'
import { getAccountAddress, getAttestationKey } from './attestation'

export const SIGNATURE_PREFIX = 'attestation-service-status-signature:'
export const StatusRequestType = t.type({
  messageToSign: t.union([SignatureType, t.undefined]),
})

export type StatusRequest = t.TypeOf<typeof StatusRequestType>

function produceSignature(message: string | undefined) {
  if (!message) {
    return undefined
  }
  const key = getAttestationKey()
  const address = privateKeyToAddress(key)
  return serializeSignature(signMessage(SIGNATURE_PREFIX + message, key, address))
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
          signature: produceSignature(statusRequest.messageToSign),
        })
      )
      .status(200)
  } catch (error) {
    console.error(error)
    respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}
