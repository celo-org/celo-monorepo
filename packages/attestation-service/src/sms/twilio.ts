import Logger from 'bunyan'
import express from 'express'
import twilio, { Twilio } from 'twilio'
import { AttestationStatus, SmsFields } from '../models/attestation'
import { SmsProvider, SmsProviderType } from './base'
import { receivedDeliveryReport } from './index'

export abstract class TwilioSmsProvider extends SmsProvider {
  client: Twilio
  type = SmsProviderType.TWILIO
  deliveryStatusURL: string | undefined

  constructor(twilioSid: string, twilioAuthToken: string, unsupportedRegionCodes: string[]) {
    super()
    this.client = twilio(twilioSid, twilioAuthToken)
    this.unsupportedRegionCodes = unsupportedRegionCodes
  }

  initialize(deliveryStatusURL?: string) {
    this.deliveryStatusURL = deliveryStatusURL
  }

  async receiveDeliveryStatusReport(req: express.Request, logger: Logger) {
    await receivedDeliveryReport(
      req.body.MessageSid,
      this.deliveryStatus(req.body.MessageStatus),
      req.body.ErrorCode,
      logger
    )
  }

  deliveryStatus(messageStatus: string | null): AttestationStatus {
    switch (messageStatus) {
      case 'delivered':
        return AttestationStatus.Delivered
      case 'failed':
        return AttestationStatus.Failed
      case 'undelivered':
        return AttestationStatus.Failed
      case 'sent':
        return AttestationStatus.Upstream
      case 'queued':
        return AttestationStatus.Queued
    }
    return AttestationStatus.Other
  }

  deliveryStatusMethod = () => 'POST'

  deliveryStatusHandlers() {
    return [
      express.urlencoded({ extended: false }),
      twilio.webhook({ url: this.deliveryStatusURL! }),
    ]
  }

  async sendSms(_attestation: SmsFields): Promise<string> {
    throw new Error('Not implemented')
  }
}

// Importing in index directly from the files causes a circular import error
export { TwilioMessagingProvider } from './twilioMessaging'
export { TwilioVerifyProvider } from './twilioVerify'
