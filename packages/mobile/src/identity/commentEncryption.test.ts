import { hexToBuffer } from '@celo/utils/src/address'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import {
  checkTxsForIdentityMetadata,
  decryptComment,
  embedPhoneNumberMetadata,
  encryptComment,
  extractPhoneNumberMetadata,
  getCommentKey,
} from 'src/identity/commentEncryption'
import { PhoneNumberHashDetails } from 'src/identity/privacy'
import { getMockStoreData } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockComment,
  mockE164Number,
  mockE164NumberSalt,
  mockPrivateDEK,
  mockPrivateDEK2,
  mockPublicDEK,
  mockPublicDEK2,
} from 'test/values'

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from(new Uint8Array(16).fill(1))),
}))

const simpleComment = 'Simple comment'
const simpleCommentEnc =
  'BNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBCVYJWqi/TZNXbAR9ziyX5MJCtfdulxA1tjlvHR/xpE6WnlC/kyXAfKIMqgKGJXchBNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBBhjruDecYg9fsrPNcQbI3AkcvWra1MHIeOZlcycn7Vqtx+UVNR59A3kqdIDbLuGiAQEBAQEBAQEBAQEBAQEBAQ13jJ/iheQ05aIkSedfLcnSa3Rtr4dsbNt59TAZsQqGxPClubtekbOKaHz7lE5zyI803qP65frfyyCxuQ=='
const simpleCommentWithMetadata = 'Simple comment~+14155550000piWqRHHYWtfg9'
const simpleCommentWithMetadataEnc =
  'BNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBCVYJWqi/TZNXbAR9ziyX5MJCtfdulxA1tjlvHR/xpE6WnlC/kyXAfKIMqgKGJXchBNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBBhjruDecYg9fsrPNcQbI3AkcvWra1MHIeOZlcycn7Vqtx+UVNR59A3kqdIDbLuGiAQEBAQEBAQEBAQEBAQEBAQ13jJ/iheQ05aIkSedfLcnSa3Rtr4dsbNt59TBTlRnqnaAoz0HyOyScr6ckQczlhtxwBqKgGuXE9OnjyeH4PIJ9yutViWOO+glrLIFjpDyl+7FebiJv/p9Ay21LHpUd7b5lSV4PWPDxamBMp6MHRdA='
const complexComment = 'long comment with emoji 😇🤠👳🏽‍♂️~ test TEST test'
const complexCommentEnc =
  'BNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBCVYJWqi/TZNXbAR9ziyX5MJCtfdulxA1tjlvHR/xpE6WnlC/kyXAfKIMqgKGJXchBNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBBhjruDecYg9fsrPNcQbI3AkcvWra1MHIeOZlcycn7Vqtx+UVNR59A3kqdIDbLuGiAQEBAQEBAQEBAQEBAQEBATJ3ip/hhfM0qaIiSahfI8nQa3xtrId9bJV59jBElUbqxKA8zxXyYyTGr/gkHcz1htGoMXyuwrUZoDHHFawgk1046uFz352n+l1rPoFhpHal6vE9k3lR9wF0GN/aWTe2L2g/hp8QQdlwuCgsZnjOVB7hDjSvOZ68mz7WqNk29RT57sb3nMkV'

const phoneDetails: PhoneNumberHashDetails = {
  e164Number: mockE164Number,
  salt: mockE164NumberSalt,
  phoneHash: 'hash',
}

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
    await expectSaga(encryptComment, simpleComment, mockAccount2, mockAccount)
      .provide([
        [call(getCommentKey, mockAccount), hexToBuffer(mockPublicDEK)],
        [call(getCommentKey, mockAccount2), hexToBuffer(mockPublicDEK2)],
      ])
      .returns(simpleCommentEnc)
      .run()
  })

  it('Complex comment', async () => {
    await expectSaga(encryptComment, complexComment, mockAccount2, mockAccount)
      .provide([
        [call(getCommentKey, mockAccount), hexToBuffer(mockPublicDEK)],
        [call(getCommentKey, mockAccount2), hexToBuffer(mockPublicDEK2)],
      ])
      .returns(complexCommentEnc)
      .run()
  })

  it('Comment with metadata enabled', async () => {
    const mockState = getMockStoreData({
      account: { e164PhoneNumber: mockE164Number },
      identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberSalt } },
    })
    await expectSaga(encryptComment, simpleComment, mockAccount2, mockAccount, true)
      .withState(mockState)
      .provide([
        [call(getCommentKey, mockAccount), hexToBuffer(mockPublicDEK)],
        [call(getCommentKey, mockAccount2), hexToBuffer(mockPublicDEK2)],
      ])
      .returns(simpleCommentWithMetadataEnc)
      .run()
  })
})

describe('Decrypt Comment', () => {
  it('Empty comment', () => {
    expect(decryptComment('', mockPrivateDEK, false)).toMatchObject({ comment: '' })
  })

  it('Empty to/from address', async () => {
    expect(decryptComment(simpleComment, null, false)).toMatchObject({ comment: simpleComment })
  })

  it('Basic comment as sender', async () => {
    expect(decryptComment(simpleCommentEnc, mockPrivateDEK, true)).toMatchObject({
      comment: simpleComment,
    })
  })

  it('Basic comment as receiver', async () => {
    expect(decryptComment(simpleCommentEnc, mockPrivateDEK2, false)).toMatchObject({
      comment: simpleComment,
    })
  })

  it('Complex comment', async () => {
    expect(decryptComment(complexCommentEnc, mockPrivateDEK, true)).toMatchObject({
      comment: complexComment,
    })
  })

  it('Comment with metadata', async () => {
    expect(decryptComment(simpleCommentWithMetadataEnc, mockPrivateDEK2, false)).toMatchObject({
      comment: simpleComment,
      e164Number: mockE164Number,
      salt: mockE164NumberSalt,
    })
  })
})

describe(embedPhoneNumberMetadata, () => {
  it('comment without phone details', () => {
    expect(embedPhoneNumberMetadata(complexComment, undefined)).toBe(complexComment)
  })

  it('comment with phone details', () => {
    expect(embedPhoneNumberMetadata(complexComment, phoneDetails)).toBe(
      complexComment + '~+14155550000piWqRHHYWtfg9'
    )
  })
})

describe(extractPhoneNumberMetadata, () => {
  it('Empty comment', () => {
    expect(extractPhoneNumberMetadata('')).toMatchObject({ comment: '' })
  })

  it('comment without metadata', () => {
    expect(extractPhoneNumberMetadata(complexComment)).toMatchObject({ comment: complexComment })
  })

  it('simple comment with metadata', () => {
    expect(extractPhoneNumberMetadata(simpleCommentWithMetadata)).toMatchObject({
      comment: simpleComment,
      e164Number: mockE164Number,
      salt: mockE164NumberSalt,
    })
  })

  it('complex comment with metadata', () => {
    const comment = embedPhoneNumberMetadata(complexComment, phoneDetails)
    expect(extractPhoneNumberMetadata(comment)).toMatchObject({
      comment: complexComment,
      e164Number: mockE164Number,
      salt: mockE164NumberSalt,
    })
  })
})

describe.only(checkTxsForIdentityMetadata, () => {
  it('Finds metadata and dispatches updates', () => {
    // TODO
  })
})
