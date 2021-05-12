import bodyParser from 'body-parser'
import Logger from 'bunyan'
import express from 'express'
import twilio, { Twilio } from 'twilio'
import { fetchEnv } from '../env'
import { AttestationModel, AttestationStatus } from '../models/attestation'
import { readUnsupportedRegionsFromEnv, SmsProvider, SmsProviderType } from './base'
import { receivedDeliveryReport } from './index'

export class TwilioSmsProvider extends SmsProvider {
  static fromEnv() {
    return new TwilioSmsProvider(
      fetchEnv('TWILIO_ACCOUNT_SID'),
      fetchEnv('TWILIO_MESSAGING_SERVICE_SID'),
      fetchEnv('TWILIO_AUTH_TOKEN'),
      readUnsupportedRegionsFromEnv('TWILIO_UNSUPPORTED_REGIONS', 'TWILIO_BLACKLIST')
    )
  }

  client: Twilio
  messagingServiceSid: string
  type = SmsProviderType.TWILIO
  deliveryStatusURL: string | undefined

  constructor(
    twilioSid: string,
    messagingServiceSid: string,
    twilioAuthToken: string,
    unsupportedRegionCodes: string[]
  ) {
    super()
    this.client = twilio(twilioSid, twilioAuthToken)
    this.messagingServiceSid = messagingServiceSid
    this.unsupportedRegionCodes = unsupportedRegionCodes
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
      bodyParser.urlencoded({ extended: false }),
      twilio.webhook({ url: this.deliveryStatusURL! }),
    ]
  }

  async initialize(deliveryStatusURL: string) {
    // Ensure the messaging service exists
    try {
      await this.client.messaging.services.get(this.messagingServiceSid).fetch()
      this.deliveryStatusURL = deliveryStatusURL
    } catch (error) {
      throw new Error(`Twilio Messaging Service could not be fetched: ${error}`)
    }
  }

  async sendSms(attestation: AttestationModel) {
    const m = await this.client.messages.create({
      body: attestation.message,
      to: attestation.phoneNumber,
      from: this.messagingServiceSid,
      statusCallback: this.deliveryStatusURL,
    })
    return m.sid
  }
}
