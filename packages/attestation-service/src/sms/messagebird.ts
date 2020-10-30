import bodyParser from 'body-parser'
import Logger from 'bunyan'
import { randomBytes } from 'crypto'
import express from 'express'
import initMB, { MessageBird } from 'messagebird'
import util from 'util'
import { fetchEnv } from '../env'
import { AttestationModel, AttestationStatus } from '../models/attestation'
import { readUnsupportedRegionsFromEnv, SmsProvider, SmsProviderType } from './base'
import { receivedDeliveryReport } from './index'

export class MessageBirdSmsProvider extends SmsProvider {
  static fromEnv() {
    return new MessageBirdSmsProvider(
      fetchEnv('MESSAGEBIRD_API_KEY'),
      readUnsupportedRegionsFromEnv('MESSAGEBIRD_UNSUPPORTED_REGIONS')
    )
  }

  messagebird: MessageBird
  type = SmsProviderType.MESSAGEBIRD
  deliveryStatusURL: string | undefined

  constructor(apiKey: string, unsupportedRegionCodes: string[]) {
    super()
    this.messagebird = initMB(apiKey)
    this.unsupportedRegionCodes = unsupportedRegionCodes
  }

  async receiveDeliveryStatusReport(req: express.Request, logger: Logger) {
    if (typeof req.query.reference === 'string' && typeof req.query.status === 'string') {
      await receivedDeliveryReport(
        req.query.reference,
        this.deliveryStatus(req.query.status),
        typeof req.query.statusErrorCode === 'string' ? req.query.statusErrorCode : null,
        logger
      )
    }
  }

  deliveryStatus(status: string | null): AttestationStatus {
    switch (status) {
      case 'delivered':
        return AttestationStatus.Delivered
      case 'failed':
      case 'delivery_failed':
      case 'expired':
        return AttestationStatus.Failed
      case 'sent':
        return AttestationStatus.Upstream
      case 'buffered':
      case 'scheduled':
        return AttestationStatus.Queued
    }
    return AttestationStatus.Other
  }

  deliveryStatusMethod = () => 'GET'

  deliveryStatusHandlers() {
    return [bodyParser.urlencoded({ extended: false })]
  }

  async initialize(deliveryStatusURL: string) {
    // Ensure the messaging service exists
    try {
      this.deliveryStatusURL = deliveryStatusURL
    } catch (error) {
      throw new Error(`Twilio Messaging Service could not be fetched: ${error}`)
    }
  }

  async sendSms(attestation: AttestationModel) {
    const reference = randomBytes(8).toString('hex')
    const m = await util.promisify(this.messagebird.messages.create)({
      originator: 'Celo',
      recipients: [attestation.phoneNumber],
      body: attestation.message,
      reference,
      reportUrl: this.deliveryStatusURL,
    })

    if (!m || !m.id || !m.reference) {
      throw new Error('Could not send SMS!')
    }
    return reference
  }
}
