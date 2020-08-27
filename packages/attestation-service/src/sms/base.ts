import { E164Number } from '@celo/utils/lib/io'
import express from 'express'
import { fetchEnvOrDefault } from '../env'

// State for an ongoing cross-provider delivery attempt
export interface SmsDelivery {
  countryCode: string
  phoneNumber: E164Number
  message: string
  attemptsForThisProvider: number
  providers: SmsProvider[]
  ongoingDeliveryId: string | null
  status: DeliveryStatus
  createdCallback?: (createdWithProvider: SmsProviderType) => void
  finallyFailedCallback?: () => void
  finallyBelievedDeliveredCallback?: () => void
}

export enum DeliveryStatus {
  NotCreated, // Not yet received ok by a provider
  Created, // Received ok by provider
  Queued, // Buffered or queued, but still in flight
  Upstream, // Reached upstream carrier
  Other,
  Delivered, // Success!
  Failed, // We will try to retransmit.
}

export abstract class SmsProvider {
  abstract type: SmsProviderType
  unsupportedRegionCodes: string[] = []

  canServePhoneNumber(countryCode: string, _: E164Number) {
    return !this.unsupportedRegionCodes.includes(countryCode.toUpperCase())
  }
  // Should throw Error when unsuccesful, return if successful
  abstract sendSms(delivery: SmsDelivery): Promise<string>

  // True if this provider supports delivery status updates as POSTs to an endpoint delivery_<providername>/
  abstract supportsDeliveryStatus(): boolean

  abstract deliveryStatusHandlers(): express.Handler[]

  // Should throw Error when unsuccesful, return if successful
  abstract receiveDeliveryStatusReport(req: express.Request): Promise<void>
}

export enum SmsProviderType {
  NEXMO = 'nexmo',
  UNKNOWN = 'unknown',
  TWILIO = 'twilio',
}

export function readUnsupportedRegionsFromEnv(...envVarNames: string[]) {
  return envVarNames
    .map((envVarName) =>
      fetchEnvOrDefault(envVarName, '')
        .toUpperCase()
        .split(',')
        .filter((code) => code !== '')
    )
    .reduce((acc, v) => acc.concat(v), [])
}

export function obfuscateNumber(phoneNumber: string): string {
  try {
    return phoneNumber.slice(0, 7) + '...'
  } catch {
    return ''
  }
}
