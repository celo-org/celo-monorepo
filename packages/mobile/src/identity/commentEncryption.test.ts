import {
  checkTxsForIdentityMetadata,
  embedPhoneNumberMetadata,
  encryptComment,
  extractPhoneNumberMetadata,
} from 'src/identity/commentEncryption'
import { mockComment } from 'test/values'

jest.mock('src/web3/actions', () => ({
  ...jest.requireActual('src/web3/actions'),
  unlockAccount: jest.fn(async () => true),
}))

describe('Encrypt Comment', () => {
  it('Empty comment', async () => {
    expect(encryptComment('', 'toAddr', 'fromAddr').next().value).toBe('')
  })

  it('Empty to/from address', async () => {
    expect(encryptComment(mockComment, '', 'fromAddr').next().value).toBe(mockComment)
    expect(encryptComment(mockComment, '', 'fromAddr').next().value).toBe(mockComment)
    expect(encryptComment(mockComment, 'toAddr', '').next().value).toBe(mockComment)
    expect(encryptComment(mockComment, '', '').next().value).toBe(mockComment)
    expect(encryptComment(mockComment, '', null).next().value).toBe(mockComment)
    expect(encryptComment(mockComment, null, null).next().value).toBe(mockComment)
    expect(encryptComment(mockComment, null, 'fromAddr').next().value).toBe(mockComment)
  })

  it('Basic comment', async () => {
    expect(encryptComment('My simple comment', 'toAddr', 'fromAddr').next().value).toBe('')
  })

  it('Complex comment', async () => {
    expect(encryptComment('comment with emoji 😇🤠👳🏽‍♂️~', 'toAddr', 'fromAddr').next().value).toBe('')
  })

  it('Comment with metadata enabled', async () => {
    expect(
      encryptComment('comment with emoji 😇🤠👳🏽‍♂️~', 'toAddr', 'fromAddr', true).next().value
    ).toBe('')
  })
})

describe('Decrypt Comment', () => {
  it('Empty comment', () => {
    // TODO
  })

  it('Empty to/from address', async () => {
    // TODO
  })

  it('Basic comment', async () => {
    // TODO
  })

  it('Complex comment', async () => {
    // TODO
  })

  it('Comment with metadata', async () => {
    // TODO
  })
})

describe(embedPhoneNumberMetadata, () => {
  it('comment with phone details', () => {
    // TODO
    // comment with emoji 😇🤠👳🏽‍♂️~+14155556666piWqRHHYWtfg9
  })

  it('comment without phone details', () => {
    // TODO
  })
})

describe(extractPhoneNumberMetadata, () => {
  it('Empty comment', () => {
    // TODO
  })

  it('comment with metadata', () => {
    // TODO
    // comment with emoji 😇🤠👳🏽‍♂️~+14155556666piWqRHHYWtfg9
  })

  it('comment with emoji and metadata', () => {
    // TODO
  })

  it('comment without metadata', () => {
    // TODO
  })
})

describe(checkTxsForIdentityMetadata, () => {
  it('Finds metadata and dispatches updates', () => {
    // TODO
  })
})
