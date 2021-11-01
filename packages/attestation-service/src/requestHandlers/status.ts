import { AttestationServiceStatusResponseType, SignatureType } from '@celo/utils/lib/io'
import express from 'express'
import * as t from 'io-ts'
import { getAgeOfLatestBlock, isNodeSyncing, useKit } from '../db'
import { fetchEnvOrDefault, getAccountAddress, getAttestationSignerAddress, isYes } from '../env'
import { ErrorMessages, respondWithError } from '../request'
import { configuredSmsProviders } from '../sms'

export const VERSION = process.env.npm_package_version as string
export const SIGNATURE_PREFIX = 'attestation-service-status-signature:'
export const StatusRequestType = t.type({
  messageToSign: t.union([SignatureType, t.undefined]),
})

export type StatusRequest = t.TypeOf<typeof StatusRequestType>

function produceSignature(message: string | undefined) {
  if (!message) {
    return undefined
  }

  return useKit((kit) =>
    kit.connection.sign(SIGNATURE_PREFIX + message, getAttestationSignerAddress())
  )
}

export async function handleStatusRequest(
  _req: express.Request,
  res: express.Response,
  statusRequest: StatusRequest
) {
  try {
    const { ageOfLatestBlock, number: latestBlock } = await getAgeOfLatestBlock()
    res
      .json(
        AttestationServiceStatusResponseType.encode({
          status: 'ok',
          smsProviders: configuredSmsProviders(),
          blacklistedRegionCodes: [], // for backwards compatibility
          accountAddress: getAccountAddress(),
          signature: await produceSignature(statusRequest.messageToSign),
          version: VERSION,
          latestBlock,
          ageOfLatestBlock,
          isNodeSyncing: await isNodeSyncing(),
          appSignature: fetchEnvOrDefault('APP_SIGNATURE', 'unknown'),
          smsProvidersRandomized: isYes(fetchEnvOrDefault('SMS_PROVIDERS_RANDOMIZED', '0')),
          maxDeliveryAttempts: parseInt(
            fetchEnvOrDefault(
              'MAX_DELIVERY_ATTEMPTS',
              fetchEnvOrDefault('MAX_PROVIDER_RETRIES', '3')
            ),
            10
          ),
          maxRerequestMins: parseInt(fetchEnvOrDefault('MAX_REREQUEST_MINS', '55'), 10),
          twilioVerifySidProvided: !!fetchEnvOrDefault('TWILIO_VERIFY_SERVICE_SID', ''),
        })
      )
      .status(200)
  } catch (error) {
    console.error(error)
    respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}
