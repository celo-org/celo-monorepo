import { encryptComment } from 'src/identity/commentKey'
import { mockComment } from 'test/values'

jest.mock('src/web3/actions', () => ({
  ...jest.requireActual('src/web3/actions'),
  unlockAccount: jest.fn(async () => true),
}))

jest.mock('@celo/walletkit', () => ({
  ...jest.requireActual('@celo/walletkit'),
  sendTransaction: jest.fn(async () => null),
}))

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('Encrypt Comment', () => {
  it('Empty comment', async () => {
    expect(await encryptComment('', 'toAddr', 'fromAddr')).toBe('')
  })

  it('Empty to/from address', async () => {
    expect(await encryptComment(mockComment, '', 'fromAddr')).toBe(mockComment)
    expect(await encryptComment(mockComment, 'toAddr', '')).toBe(mockComment)
    expect(await encryptComment(mockComment, '', '')).toBe(mockComment)
    expect(await encryptComment(mockComment, '', undefined)).toBe(mockComment)
    expect(await encryptComment(mockComment, null, undefined)).toBe(mockComment)
    expect(await encryptComment(mockComment, null, 'fromAddr')).toBe(mockComment)
  })
})
