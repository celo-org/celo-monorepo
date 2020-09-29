import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import { IdentifierLookupResult } from '@celo/contractkit/lib/wrappers/Attestations'
import { hexToBuffer } from '@celo/utils/src/address'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { TokenTransactionType, TransactionFeedFragment } from 'src/apollo/types'
import { updateE164PhoneNumberAddresses, updateE164PhoneNumberSalts } from 'src/identity/actions'
import {
  checkTxsForIdentityMetadata,
  decryptComment,
  embedPhoneNumberMetadata,
  encryptComment,
  extractPhoneNumberMetadata,
} from 'src/identity/commentEncryption'
import { lookupAttestationIdentifiers } from 'src/identity/contactMapping'
import { e164NumberToAddressSelector, e164NumberToSaltSelector } from 'src/identity/reducer'
import { doFetchDataEncryptionKey } from 'src/web3/dataEncryptionKey'
import { dataEncryptionKeySelector } from 'src/web3/selectors'
import { getMockStoreData } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockComment,
  mockE164Number,
  mockE164NumberHashWithPepper,
  mockE164NumberPepper,
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
  pepper: mockE164NumberPepper,
  phoneHash: 'hash',
}

describe('Encrypt Comment', () => {
  it('Handles empty comment', async () => {
    expect(encryptComment('', 'toAddr', 'fromAddr').next().value).toBe('')
  })

  it('Handles empty to/from address', async () => {
    expect(encryptComment(mockComment, '', 'fromAddr').next().value).toBe(mockComment)
    expect(encryptComment(mockComment, '', 'fromAddr').next().value).toBe(mockComment)
    expect(encryptComment(mockComment, 'toAddr', '').next().value).toBe(mockComment)
    expect(encryptComment(mockComment, '', '').next().value).toBe(mockComment)
    expect(encryptComment(mockComment, '', null).next().value).toBe(mockComment)
    expect(encryptComment(mockComment, null, null).next().value).toBe(mockComment)
    expect(encryptComment(mockComment, null, 'fromAddr').next().value).toBe(mockComment)
  })

  it('Handles basic comment', async () => {
    await expectSaga(encryptComment, simpleComment, mockAccount2, mockAccount)
      .provide([
        [call(doFetchDataEncryptionKey, mockAccount), hexToBuffer(mockPublicDEK)],
        [call(doFetchDataEncryptionKey, mockAccount2), hexToBuffer(mockPublicDEK2)],
      ])
      .returns(simpleCommentEnc)
      .run()
  })

  it('Handles complex comment', async () => {
    await expectSaga(encryptComment, complexComment, mockAccount2, mockAccount)
      .provide([
        [call(doFetchDataEncryptionKey, mockAccount), hexToBuffer(mockPublicDEK)],
        [call(doFetchDataEncryptionKey, mockAccount2), hexToBuffer(mockPublicDEK2)],
      ])
      .returns(complexCommentEnc)
      .run()
  })

  it('Handles comment with metadata enabled', async () => {
    const mockState = getMockStoreData({
      account: { e164PhoneNumber: mockE164Number },
      identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
    })
    await expectSaga(encryptComment, simpleComment, mockAccount2, mockAccount, true)
      .withState(mockState)
      .provide([
        [call(doFetchDataEncryptionKey, mockAccount), hexToBuffer(mockPublicDEK)],
        [call(doFetchDataEncryptionKey, mockAccount2), hexToBuffer(mockPublicDEK2)],
      ])
      .returns(simpleCommentWithMetadataEnc)
      .run()
  })
})

describe('Decrypt Comment', () => {
  it('Handles empty comment', () => {
    expect(decryptComment('', mockPrivateDEK, false)).toMatchObject({ comment: '' })
  })

  it('Handles empty to/from address', async () => {
    expect(decryptComment(simpleComment, null, false)).toMatchObject({ comment: simpleComment })
  })

  it('Handles basic comment as sender', async () => {
    expect(decryptComment(simpleCommentEnc, mockPrivateDEK, true)).toMatchObject({
      comment: simpleComment,
    })
  })

  it('Handles basic comment as receiver', async () => {
    expect(decryptComment(simpleCommentEnc, mockPrivateDEK2, false)).toMatchObject({
      comment: simpleComment,
    })
  })

  it('Handles complex comment', async () => {
    expect(decryptComment(complexCommentEnc, mockPrivateDEK, true)).toMatchObject({
      comment: complexComment,
    })
  })

  it('Handles comment with metadata', async () => {
    expect(decryptComment(simpleCommentWithMetadataEnc, mockPrivateDEK2, false)).toMatchObject({
      comment: simpleComment,
      e164Number: mockE164Number,
      salt: mockE164NumberPepper,
    })
  })
})

describe(embedPhoneNumberMetadata, () => {
  it('Handles comment without phone details', () => {
    expect(embedPhoneNumberMetadata(complexComment, undefined)).toBe(complexComment)
  })

  it('Handles comment with phone details', () => {
    expect(embedPhoneNumberMetadata(complexComment, phoneDetails)).toBe(
      complexComment + '~+14155550000piWqRHHYWtfg9'
    )
  })
})

describe(extractPhoneNumberMetadata, () => {
  it('Handles empty comment', () => {
    expect(extractPhoneNumberMetadata('')).toMatchObject({ comment: '' })
  })

  it('Handles comment without metadata', () => {
    expect(extractPhoneNumberMetadata(complexComment)).toMatchObject({ comment: complexComment })
  })

  it('Handles simple comment with metadata', () => {
    expect(extractPhoneNumberMetadata(simpleCommentWithMetadata)).toMatchObject({
      comment: simpleComment,
      e164Number: mockE164Number,
      salt: mockE164NumberPepper,
    })
  })

  it('Handles complex comment with metadata', () => {
    const comment = embedPhoneNumberMetadata(complexComment, phoneDetails)
    expect(extractPhoneNumberMetadata(comment)).toMatchObject({
      comment: complexComment,
      e164Number: mockE164Number,
      salt: mockE164NumberPepper,
    })
  })
})

describe(checkTxsForIdentityMetadata, () => {
  const transactions: TransactionFeedFragment[] = [
    {
      __typename: 'TokenTransfer',
      type: TokenTransactionType.Sent,
      hash: '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353',
      amount: {
        __typename: 'MoneyAmount',
        value: '-0.2',
        currencyCode: 'cUSD',
        localAmount: {
          __typename: 'LocalMoneyAmount',
          value: '-0.2',
          currencyCode: 'USD',
          exchangeRate: '1',
        },
      },
      timestamp: 1578530538,
      address: mockAccount,
      comment: simpleComment,
    },
    {
      __typename: 'TokenExchange',
      type: TokenTransactionType.Exchange,
      hash: '0x16fbd53c4871f0657f40e1b4515184be04bed8912c6e2abc2cda549e4ad8f852',
    } as any,
    {
      __typename: 'TokenTransfer',
      type: TokenTransactionType.Received,
      hash: '0x28147e5953639687915e9b152173076611cc9e51e8634fad3850374ccc87d7aa',
      amount: {
        __typename: 'MoneyAmount',
        value: '-0.2',
        currencyCode: 'cUSD',
        localAmount: {
          __typename: 'LocalMoneyAmount',
          value: '-0.2',
          currencyCode: 'USD',
          exchangeRate: '1',
        },
      },
      timestamp: 1578530602,
      address: mockAccount,
      comment: simpleCommentWithMetadataEnc,
    },
  ]

  it('Finds metadata and dispatches updates', async () => {
    const lookupResult: IdentifierLookupResult = {
      [mockE164NumberHashWithPepper]: {
        [mockAccount]: { completed: 3, total: 5 },
      },
    }
    await expectSaga(checkTxsForIdentityMetadata, { transactions })
      .provide([
        [select(dataEncryptionKeySelector), mockPrivateDEK2],
        [matchers.call.fn(lookupAttestationIdentifiers), lookupResult],
        [select(e164NumberToSaltSelector), {}],
        [select(e164NumberToAddressSelector), {}],
      ])
      .put(updateE164PhoneNumberSalts({ [mockE164Number]: mockE164NumberPepper }))
      .put(
        updateE164PhoneNumberAddresses(
          { [mockE164Number]: [mockAccount] },
          { [mockAccount]: mockE164Number }
        )
      )
      .run()
  })

  it('Ignores invalid identity claims', async () => {
    await expectSaga(checkTxsForIdentityMetadata, { transactions })
      .provide([
        [select(dataEncryptionKeySelector), mockPrivateDEK2],
        [matchers.call.fn(lookupAttestationIdentifiers), {}],
      ])
      .run()
  })
})
