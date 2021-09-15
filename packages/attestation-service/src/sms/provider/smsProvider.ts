import { E164Number } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import { AttestationModel } from '../../models/attestation'
import { SmsService } from '../sms.service'
import { SmsProviderType } from './smsProvider.enum'

export abstract class SmsProvider {
  abstract type: SmsProviderType
  unsupportedRegionCodes: string[] = []

  canServePhoneNumber(countryCode: string, _: E164Number) {
    return !this.unsupportedRegionCodes.includes(countryCode.toUpperCase())
  }
  abstract initialize(deliveryStatusURL: string): void

  // Should throw Error when unsuccesful, return if successful
  abstract sendSms(attestation: AttestationModel): Promise<string>

  // if this provider supports delivery status updates to an endpoint delivery_<providername>/, should return 'GET' or 'POST'
  abstract deliveryStatusMethod(): string | null

  abstract deliveryStatusHandlers(): express.Handler[]

  // Should throw Error when unsuccesful, return if successful
  abstract receiveDeliveryStatusReport(
    req: express.Request,
    logger: Logger,
    smsService: SmsService
  ): Promise<void>
}
