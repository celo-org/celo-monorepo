import bodyParser from 'body-parser'
import express from 'express'
import { PhoneNumberUtil } from 'google-libphonenumber'
import Nexmo from 'nexmo'
import { receivedDeliveryReport } from '.'
import { fetchEnv, fetchEnvOrDefault, isYes } from '../env'
import { Gauges } from '../metrics'
import {
  DeliveryStatus,
  readUnsupportedRegionsFromEnv,
  SmsDelivery,
  SmsProvider,
  SmsProviderType,
} from './base'

const phoneUtil = PhoneNumberUtil.getInstance()

export class NexmoSmsProvider extends SmsProvider {
  static fromEnv() {
    return new NexmoSmsProvider(
      fetchEnv('NEXMO_KEY'),
      fetchEnv('NEXMO_SECRET'),
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

  constructor(
    apiKey: string,
    apiSecret: string,
    unsupportedRegionCodes: string[],
    balanceMetric: boolean
  ) {
    super()
    this.client = new Nexmo({
      apiKey,
      apiSecret,
    })
    this.balanceMetric = balanceMetric
    this.unsupportedRegionCodes = unsupportedRegionCodes
  }

  initialize = async () => {
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

  async receiveDeliveryStatusReport(req: express.Request) {
    const errCode =
      req.body['err-code'] == null || req.body['err-code'] === '0' ? null : req.body['err-code']
    receivedDeliveryReport(req.body.messageId, this.deliveryStatus(req.body.status), errCode)
  }

  deliveryStatus(messageStatus: string | null): DeliveryStatus {
    switch (messageStatus) {
      case 'delivered':
        return DeliveryStatus.Delivered
      case 'failed':
        return DeliveryStatus.Failed
      case 'rejected':
        return DeliveryStatus.Failed
      case 'accepted':
        return DeliveryStatus.Upstream
      case 'buffered':
        return DeliveryStatus.Queued
    }
    return DeliveryStatus.Other
  }

  supportsDeliveryStatus = () => true

  deliveryStatusHandlers = () => [bodyParser.json()]

  async sendSms(delivery: SmsDelivery) {
    const nexmoNumber = this.getMatchingNumber(delivery.countryCode)
    return new Promise<string>((resolve, reject) => {
      this.client.message.sendSms(
        nexmoNumber,
        delivery.phoneNumber,
        delivery.message,
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

  private getAvailableNumbers = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      this.client.number.get(null, (err: Error, responseData: any) => {
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
