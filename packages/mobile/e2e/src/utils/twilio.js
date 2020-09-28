import twilio from 'twilio'
import { sleep } from './utils'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = twilio(accountSid, authToken)

const MAX_TRIES = 60

export const receiveSms = async () => {
  let tryNumber = 0

  while (tryNumber < MAX_TRIES) {
    const messages = await client.messages.list({
      dateSentAfter: new Date(Date.now() - 3 * 60 * 1000),
      limit: 3,
    })
    const codes = messages.map((message) => message.body)
    console.log('Codes received:', codes)
    if (codes.length === 3) {
      return codes
    }
    tryNumber += 1
    await sleep(1000)
  }
  return []
}
