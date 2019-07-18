// Recommended reading: https://firebase.google.com/docs/functions/unit-testing
import FunctionsTest from 'firebase-functions-test'
import supertest from 'supertest'
import { CELO_ENV } from '../src/celoEnv'
import {
  getMockDatabase,
  messageDbPath,
  messagesDbPath,
  mockMessage,
  mockMessageId,
  mockMessagesDispatching,
  mockMessageSent,
  mockMessagesSent,
  mockVerifiersActive,
  mockVerifiersUneligible,
  verifiersDbPath,
} from './mocks'

jest.mock('../src/validation', () => ({
  ...jest.requireActual('../src/validation'),
  validateRequest: jest.fn(() => true),
}))

const functionsTest = FunctionsTest()
const fakeAddress = '0x0000000000000000000000000000000000000001'
const garbageLong = 'iu2903urowjdskjfnn293ufjvxncvjkhdsfjhsu'
const garbageShort = '92iosdj#'
functionsTest.mockConfig({
  shared: {
    ['eth-address']: fakeAddress,
    ['eth-private-key']: garbageLong,
    ['twilio-phone-number']: '+15555555555',
    ['twilio-sid']: garbageLong,
    ['twilio-auth-token']: garbageLong,
    ['fcmKey']: garbageLong,
  },
  [CELO_ENV]: {
    ['testnet-id']: '1101',
    ['tx-port']: '8545',
    ['tx-ip']: '35.199.187.51',
    ['app-signature']: garbageShort,
    ['sms-ack-timeout']: 100, // 0.1 seconds
  },
})

// Using require here to avoid auto sorting alphabetically.
// We need to import mocks and setup functionsTest first.
const celoFunctions = require('../src/index')

const mockSmsRequestData = {
  account: 'AAAAAAAAAAAAAAAAAAAAAAAAAAE=', // Base64 of mockmessage.address
  issuer: 'AAAAAAAAAAAAAAAAAAAAAAAAAAE=',
  phoneNumber: mockMessage.phoneNum,
  message: 'AAAAAAAAAAAAAAAAAAAAAAAAAAE=',
}
const smsEndpoint = '/v0.1/sms'
// const rewardsEndpoint = '/v0.1/rewards'

function sendPostRequestToPool(path: string, data: any, onDone: (resData: any) => void) {
  return supertest(celoFunctions[`handleVerificationRequest${CELO_ENV}`])
    .post(path)
    .send(data)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .expect(200)
    .then((res: supertest.Response) => {
      console.debug('Done post request')
      onDone(res.body)
    })
}

describe(`POST ${smsEndpoint} endpoint`, () => {
  it('handles active, successful verifiers correctly', () => {
    getMockDatabase().set(verifiersDbPath, mockVerifiersActive)
    getMockDatabase().set(messageDbPath, mockMessageSent)
    getMockDatabase().set(messagesDbPath, {})
    return sendPostRequestToPool(smsEndpoint, mockSmsRequestData, (resData: any) => {
      expect(resData.messageId).toBe(mockMessageId)
    })
  })
  it('handles no active verifiers correctly', () => {
    getMockDatabase().set(verifiersDbPath, {})
    getMockDatabase().set(messageDbPath, mockMessage)
    getMockDatabase().set(messagesDbPath, mockMessagesDispatching)
    return sendPostRequestToPool(smsEndpoint, mockSmsRequestData, (resData: any) => {
      expect(resData.messageId).toBe('Twilio')
    })
  })
  it('handles no verifier timeout correctly', () => {
    getMockDatabase().set(verifiersDbPath, mockVerifiersActive)
    getMockDatabase().set(messagesDbPath, mockMessagesDispatching)
    return sendPostRequestToPool(smsEndpoint, mockSmsRequestData, (resData: any) => {
      expect(resData.messageId).toBe('Twilio')
    })
  })
  it('handles no eligible verifiers correctly', () => {
    getMockDatabase().set(verifiersDbPath, mockVerifiersUneligible)
    getMockDatabase().set(messagesDbPath, mockMessagesSent)
    return sendPostRequestToPool(smsEndpoint, mockSmsRequestData, (resData: any) => {
      expect(resData.messageId).toBe('Twilio')
    })
  })
})

describe('POST /v0.1/rewards/ endpoint', () => {
  it('handles request correctly', async () => {
    // TODO
    expect(true).toBe(true)
  })
})

// cleanup possible test side-effects
functionsTest.cleanup()
