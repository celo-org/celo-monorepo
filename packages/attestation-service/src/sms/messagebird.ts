import bodyParser from 'body-parser'
import Logger from 'bunyan'
import { randomBytes } from 'crypto'
import express from 'express'
import initMB, { MessageBird } from 'messagebird'
import fetch from 'node-fetch'
import util from 'util'
import { fetchEnv } from '../env'
import { AttestationStatus, SmsFields } from '../models/attestation'
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
  apiKey: string

  constructor(apiKey: string, unsupportedRegionCodes: string[]) {
    super()
    this.apiKey = apiKey
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

  async getUSNumbers(): Promise<string[]> {
    const response = await fetch('https://numbers.messagebird.com/v1/phone-numbers?features=sms', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `AccessKey ${this.apiKey}`,
      },
    })
    if (!response.ok) {
      throw new Error('Could not list numbers! ' + response.status)
    }
    const body = JSON.parse(await response.text())
    return body.items
      ? body.items
          .filter((n: any) => n.country === 'US' && n.kycStatus === 'ok')
          .map((n: any) => n.number)
      : []
  }

  async initialize(deliveryStatusURL: string) {
    this.deliveryStatusURL = deliveryStatusURL
    let numbers
    try {
      // Ensure at least one KYC-ed US based sms number is available for SMS.
      numbers = await this.getUSNumbers()
    } catch (error) {
      throw new Error(`MessageBird: could not access numbers: ${error}`)
    }
    if (numbers.length === 0) {
      throw new Error('MessageBird: complete KYC and purchase a US-based number enabled for SMS')
    }
  }

  async sendSms(attestation: SmsFields) {
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
