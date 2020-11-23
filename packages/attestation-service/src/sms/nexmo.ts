import bodyParser from 'body-parser'
import Logger from 'bunyan'
import express from 'express'
import { PhoneNumberUtil } from 'google-libphonenumber'
import Nexmo from 'nexmo'
import { receivedDeliveryReport } from '.'
import { fetchEnv, fetchEnvOrDefault, isYes } from '../env'
import { Gauges } from '../metrics'
import { AttestationModel, AttestationStatus } from '../models/attestation'
import { readUnsupportedRegionsFromEnv, SmsProvider, SmsProviderType } from './base'

const phoneUtil = PhoneNumberUtil.getInstance()

export class NexmoSmsProvider extends SmsProvider {
  static fromEnv() {
    return new NexmoSmsProvider(
      fetchEnv('NEXMO_KEY'),
      fetchEnv('NEXMO_SECRET'),
      fetchEnvOrDefault('NEXMO_APPLICATION', ''),
      readUnsupportedRegionsFromEnv('NEXMO_UNSUPPORTED_REGIONS', 'NEXMO_BLACKLIST'),
      isYes(fetchEnvOrDefault('NEXMO_ACCOUNT_BALANCE_METRIC', ''))
    )
  }
  type = SmsProviderType.NEXMO
  client: any
  nexmoNumbers: Array<{
    code: string
    phoneNumber: string
  }> = []
  balanceMetric: boolean
  deliveryStatusURL: string | undefined
  applicationId: string | null = null

  constructor(
    apiKey: string,
    apiSecret: string,
    applicationId: string,
    unsupportedRegionCodes: string[],
    balanceMetric: boolean
  ) {
    super()
    this.applicationId = applicationId
    if (applicationId) {
      this.client = new Nexmo({
        apiKey,
        apiSecret,
        applicationId,
      })
    } else {
      this.client = new Nexmo({
        apiKey,
        apiSecret,
      })
    }
    this.balanceMetric = balanceMetric
    this.unsupportedRegionCodes = unsupportedRegionCodes
  }

  initialize = async (deliveryStatusURL: string) => {
    this.deliveryStatusURL = deliveryStatusURL

    const availableNumbers = await this.getAvailableNumbers()

    if (!availableNumbers) {
      throw new Error(
        'You have no phone numbers in your Nexmo account. Please buy at least one number at https://dashboard.nexmo.com/buy-numbers'
      )
    }
    this.nexmoNumbers = availableNumbers.map((number: any) => ({
      phoneNumber: number.msisdn,
      code: phoneUtil.getRegionCodeForNumber(phoneUtil.parse('+' + number.msisdn)),
    }))
  }

  async receiveDeliveryStatusReport(req: express.Request, logger: Logger) {
    const errCode =
      req.body['err-code'] == null || req.body['err-code'] === '0' ? null : req.body['err-code']
    await receivedDeliveryReport(
      req.body.messageId,
      this.deliveryStatus(req.body.status),
      errCode,
      logger
    )
  }

  deliveryStatus(messageStatus: string | null): AttestationStatus {
    switch (messageStatus) {
      case 'delivered':
        return AttestationStatus.Delivered
      case 'failed':
        return AttestationStatus.Failed
      case 'rejected':
        return AttestationStatus.Failed
      case 'accepted':
        return AttestationStatus.Upstream
      case 'buffered':
        return AttestationStatus.Queued
    }
    return AttestationStatus.Other
  }

  deliveryStatusMethod = () => 'POST'

  deliveryStatusHandlers = () => [bodyParser.json()]

  async sendSms(attestation: AttestationModel) {
    const nexmoNumber = this.getMatchingNumber(attestation.countryCode)
    return new Promise<string>((resolve, reject) => {
      this.client.message.sendSms(
        nexmoNumber,
        attestation.phoneNumber,
        attestation.message,
        { callback: this.deliveryStatusURL },
        (err: Error, responseData: any) => {
          if (err) {
            reject(err)
          } else {
            if (responseData.messages[0].status === '0') {
              if (this.balanceMetric) {
                try {
                  const balance = parseInt(responseData.messages[0]['remaining-balance'], 10)
                  Gauges.attestationProviderBalance.labels(this.type).set(balance)
                } catch {
                  /* tslint:disable noempty */
                }
              }
              resolve(responseData.messages[0]['message-id'])
            } else {
              reject(responseData.messages[0]['error-text'])
            }
          }
        }
      )
    })
  }

  // The only effect of supplying an applicationId is to select from numbers linked to
  // that application rather than the global pool.
  private getAvailableNumbers = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const options = this.applicationId
        ? { applicationId: this.applicationId, has_application: true }
        : null
      this.client.number.get(options, (err: Error, responseData: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(responseData.numbers)
        }
      })
    })
  }

  private getMatchingNumber = (countryCode: string) => {
    const matchingNumber = this.nexmoNumbers.find((number) => number.code === countryCode)
    if (matchingNumber !== undefined) {
      return matchingNumber.phoneNumber
    }
    return this.nexmoNumbers[0].phoneNumber
  }
}
