import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import { E164Number } from '@celo/utils/lib/io'
import { PhoneNumberUtil } from 'google-libphonenumber'
import Nexmo from 'nexmo'
import { fetchEnv } from '../env'
import { readBlacklistFromEnv, SmsProvider, SmsProviderType } from './base'

const phoneUtil = PhoneNumberUtil.getInstance()

export class NexmoSmsProvider extends SmsProvider {
  static fromEnv() {
    return new NexmoSmsProvider(
      fetchEnv('NEXMO_KEY'),
      fetchEnv('NEXMO_SECRET'),
      readBlacklistFromEnv('NEXMO_BLACKLIST')
    )
  }
  type = SmsProviderType.NEXMO
  client: any
  nexmoNumbers: Array<{
    code: string
    phoneNumber: string
  }> = []

  constructor(apiKey: string, apiSecret: string, blacklistedRegionCodes: string[]) {
    super()
    this.client = new Nexmo({
      apiKey,
      apiSecret,
    })

    this.blacklistedRegionCodes = blacklistedRegionCodes
  }

  initialize = async () => {
    const availableNumbers = await this.getAvailableNumbers()
    this.nexmoNumbers = availableNumbers.map((number: any) => ({
      phoneNumber: number.msisdn,
      code: phoneUtil.getRegionCodeForNumber(phoneUtil.parse('+' + number.msisdn)),
    }))
  }

  sendSms = async (phoneNumber: E164Number, message: string): Promise<void> => {
    const countryCode = phoneUtil.getRegionCodeForNumber(phoneUtil.parse(phoneNumber))

    if (!countryCode) {
      throw new Error('could not extract country code')
    }

    const nexmoNumber = this.getMatchingNumber(countryCode)
    // Nexmo does not support sending more than 1 text message a second from some phone numbers, so just
    // repeat with backoff
    await retryAsyncWithBackOff(
      () => this.sendSmsViaNexmo(nexmoNumber, phoneNumber, message),
      10,
      [],
      1000
    )
    return
  }

  private sendSmsViaNexmo(nexmoNumber: string, phoneNumber: string, message: string) {
    return new Promise((resolve, reject) => {
      this.client.message.sendSms(
        nexmoNumber,
        phoneNumber,
        message,
        (err: Error, responseData: any) => {
          if (err) {
            reject(err)
          } else {
            if (responseData.messages[0].status === '0') {
              resolve(responseData.messages[0])
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
