import { PhoneNumberUtil } from 'google-libphonenumber'
import Nexmo from 'nexmo'
import { fetchEnv } from './env'

const phoneUtil = PhoneNumberUtil.getInstance()

let nexmoClient: any
let nexmoNumbers: Array<{
  code: string
  phoneNumber: string
}> = []

export async function initializeSmsProviders() {
  nexmoClient = new Nexmo({
    apiKey: fetchEnv('NEXMO_KEY'),
    apiSecret: fetchEnv('NEXMO_SECRET'),
  })

  const availableNumbers = await getAvailableNumbers()

  nexmoNumbers = availableNumbers.map((number: any) => ({
    phoneNumber: number.msisdn,
    code: phoneUtil.getRegionCodeForNumber(phoneUtil.parse('+' + number.msisdn)),
  }))

  console.log(nexmoNumbers)
}

async function getAvailableNumbers(): Promise<any> {
  return new Promise((resolve, reject) => {
    nexmoClient.number.get(null, (err: Error, responseData: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(responseData.numbers)
      }
    })
  })
}

function getMatchingNumber(countryCode: string) {
  const matchingNumber = nexmoNumbers.find((number) => number.code === countryCode)
  if (matchingNumber !== undefined) {
    return matchingNumber.phoneNumber
  }
  return nexmoNumbers[0].phoneNumber
}

export async function sendSms(phoneNumber: string, message: string) {
  const countryCode = phoneUtil.getRegionCodeForNumber(phoneUtil.parse(phoneNumber))

  if (!countryCode) {
    throw new Error('could not extract country code')
  }

  return new Promise((resolve, reject) => {
    nexmoClient.message.sendSms(
      getMatchingNumber(countryCode),
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
