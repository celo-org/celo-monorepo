import { E164Number } from '@celo/phone-utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import { fetchEnvOrDefault } from '../env'
import { SmsFields } from '../models/attestation'

export abstract class SmsProvider {
  abstract type: SmsProviderType
  unsupportedRegionCodes: string[] = []

  canServePhoneNumber(countryCode: string, _: E164Number) {
    return !this.unsupportedRegionCodes.includes(countryCode.toUpperCase())
  }
  // Should throw Error when unsuccesful, return if successful
  abstract sendSms(attestation: SmsFields): Promise<string>

  // if this provider supports delivery status updates to an endpoint delivery_<providername>/, should return 'GET' or 'POST'
  abstract deliveryStatusMethod(): string | null

  abstract deliveryStatusHandlers(): express.Handler[]

  // Should throw Error when unsuccesful, return if successful
  abstract receiveDeliveryStatusReport(req: express.Request, logger: Logger): Promise<void>
}

export enum SmsProviderType {
  NEXMO = 'nexmo',
  UNKNOWN = 'unknown',
  TWILIO = 'twilio',
  TWILIO_MESSAGING = 'twiliomessaging',
  TWILIO_VERIFY = 'twilioverify',
  MESSAGEBIRD = 'messagebird',
  TELEKOM = 'telekom',
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
