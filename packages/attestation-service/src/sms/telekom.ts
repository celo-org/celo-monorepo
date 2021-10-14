import bodyParser from 'body-parser'
import Logger from 'bunyan'
import express from 'express'
import fetch from 'node-fetch'
import { receivedDeliveryReport } from '.'
import { fetchEnv, fetchEnvOrDefault } from '../env'
import { AttestationStatus, SmsFields } from '../models/attestation'
import { readUnsupportedRegionsFromEnv, SmsProvider, SmsProviderType } from './base'

export class TelekomSmsProvider extends SmsProvider {
  static fromEnv() {
    return new TelekomSmsProvider(
      fetchEnv('TELEKOM_API_KEY'),
      fetchEnv('TELEKOM_FROM'),
      fetchEnvOrDefault('TELEKOM_URL', 'https://developer-api.telekom.com/vms/Messages.json'),
      readUnsupportedRegionsFromEnv('TELEKOM_UNSUPPORTED_REGIONS')
    )
  }

  type = SmsProviderType.TELEKOM
  apiKey: string
  deliveryStatusURL: string | undefined
  fromNumber: string
  serviceURL: string

  constructor(
    apiKey: string,
    fromNumber: string,
    serviceURL: string,
    unsupportedRegionCodes: string[]
  ) {
    super()
    this.apiKey = apiKey
    this.fromNumber = fromNumber
    this.serviceURL = serviceURL
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
    return [bodyParser.urlencoded({ extended: false })]
  }

  async initialize(deliveryStatusURL: string) {
    this.deliveryStatusURL = deliveryStatusURL
  }

  async sendSms(attestation: SmsFields) {
    const response = await fetch(this.serviceURL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: this.fromNumber,
        To: attestation.phoneNumber,
        Body: attestation.message,
        StatusCallback: this.deliveryStatusURL!,
      }).toString(),
    })

    if (!response.ok) {
      throw new Error('Could not send SMS! ' + response.status)
    }

    const body = JSON.parse(await response.text())
    if (
      !body.sid ||
      !body.status ||
      this.deliveryStatus(body.status) === AttestationStatus.Failed
    ) {
      throw new Error('Could not send SMS!')
    }

    return body.sid
  }
}
