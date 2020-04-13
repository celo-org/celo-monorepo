export const enum ACCESSIBLE {
  WHEN_UNLOCKED,
  ALWAYS,
}

const RNSecureKeyStore = {
  set: jest.fn(),
  get: jest.fn(() => 'MOCK_KEY'),
}

export default RNSecureKeyStore
