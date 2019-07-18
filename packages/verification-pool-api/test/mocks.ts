import { MessageState, MobileVerifier, SMSMessage } from '../src/types'

// To unit test our Firebase functions, we need to stub out the
// Firebase resources and mock the database

const mockReference = (data: any): any => {
  return {
    updateHandler: jest.fn(() => mockReference(data)),
    orderByChild: jest.fn(() => mockReference(data)),
    equalTo: jest.fn(() => mockReference(data)),
    update: jest.fn(),
    transaction: jest.fn(),
    push: jest.fn(() => ({ key: mockMessageId })),
    remove: jest.fn(),
    once: jest.fn(() => ({ val: jest.fn(() => data) })),
  }
}

class MockDatabase {
  // Default data, can be overriden with set
  data: any = {
    mobileVerifiers: mockVerifiersActive,
    ['messages/' + mockMessageId]: mockMessage,
    messages: mockMessagesDispatching,
  }

  set(path: string, value: any) {
    this.data[path] = value
  }

  ref(refPath: string) {
    for (const dataPath of Object.keys(this.data)) {
      if (refPath.includes(dataPath)) {
        return mockReference(this.data[dataPath])
      }
    }
    return mockReference(null)
  }
}

let mockDatabase: MockDatabase
export const getMockDatabase = () => {
  if (!mockDatabase) {
    mockDatabase = new MockDatabase()
  }
  return mockDatabase
}

jest.mock('firebase-admin', () => {
  return {
    initializeApp: jest.fn(),
    database: getMockDatabase,
    messaging: () => ({ send: jest.fn() }),
  }
})

jest.mock('twilio', () =>
  jest.fn(() => ({
    messages: {
      create: jest.fn(),
    },
  }))
)

export const mockVerifierId = 'mockVerifierId'
export const mockMessageId = 'mockMessageId'
export const verifiersDbPath = 'mobileVerifiers'
export const messageDbPath = 'messages/' + mockMessageId
export const messagesDbPath = 'messages'

export const mockVerifier: MobileVerifier = {
  id: 'myVerifiedId',
  address: '0x00000000000000000000',
  fcmToken: '000000000000000000000000000',
  name: 'My Verifier',
  phoneNum: '+14155555555',
  supportedRegion: 'US',
  isVerifying: true,
  attemptCount: 5,
}

export const mockVerifiersActive: { [id: string]: MobileVerifier } = {
  [mockVerifierId]: {
    ...mockVerifier,
  },
}

export const mockVerifiersUneligible: { [id: string]: MobileVerifier } = {
  [mockVerifierId]: {
    ...mockVerifier,
    phoneNum: '+14155556666',
  },
}

export const mockMessage: SMSMessage = {
  phoneNum: '+14155556666',
  address: '0x00000000000000000000',
  message: 'Celo Verification Code 0: 00000000000000000000000000000000000000',
  verifierId: null,
  verifierCandidates: 'mockVerifierId,mockVerifierId2,mockVerifierId3',
  startTime: 1551196214320,
  finishTime: null,
  messageState: MessageState.DISPATCHING,
}
export const mockMessageSent: SMSMessage = {
  ...mockMessage,
  finishTime: 1551196342150,
  messageState: MessageState.SENT,
}

export const mockMessagesDispatching: { [id: string]: SMSMessage } = {
  [mockMessageId]: {
    ...mockMessage,
  },
}

export const mockMessagesSent: { [id: string]: SMSMessage } = {
  [mockMessageId]: {
    ...mockMessageSent,
  },
}
