import { sample } from 'lodash'
import { Twilio } from 'twilio'

export async function getPhoneNumber(twilioClient: Twilio, addressSid: string) {
  const phoneNumber = await chooseFromAvailablePhoneNumbers(twilioClient)

  if (phoneNumber !== undefined) {
    return phoneNumber
  }

  return createPhoneNumber(twilioClient, addressSid)
}

async function chooseFromAvailablePhoneNumbers(twilioClient: Twilio) {
  const availableNumbers = await twilioClient.incomingPhoneNumbers.list()
  const usableNumber = availableNumbers[0]
  return usableNumber
}
async function createPhoneNumber(twilioClient: Twilio, addressSid: string) {
  const countryCodes = ['GB', 'US']
  const countryCode = sample(countryCodes)
  const context = await twilioClient.availablePhoneNumbers.get(countryCode!)
  const numbers = await context.mobile.list({ limit: 10 })
  const usableNumber = numbers[0]

  await twilioClient.incomingPhoneNumbers.create({
    phoneNumber: usableNumber!.phoneNumber,
    addressSid,
    // Just an requestbin.com endpoint to avoid errors
    smsUrl: 'https://enzyutth0wxme.x.pipedream.net/',
  })

  return usableNumber
}
