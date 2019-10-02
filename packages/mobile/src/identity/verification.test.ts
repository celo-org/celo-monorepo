import { AttestationState, getAttestationsContract, getStableTokenContract } from '@celo/walletkit'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, delay, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames, DefaultEventNames } from 'src/analytics/constants'
import { setNumberVerified } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { cancelVerification, completeAttestationCode, endVerification } from 'src/identity/actions'
import { attestationCodesSelector } from 'src/identity/reducer'
import {
  AttestationCode,
  doVerificationFlow,
  ERROR_DURATION,
  requestAndRetrieveAttestations,
  startVerification,
  VERIFICATION_TIMEOUT,
} from 'src/identity/verification'
import { web3 } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { privateCommentKeySelector } from 'src/web3/selectors'
import { createMockContract, sleep } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockE164Number,
  mockPrivateDEK,
  mockPublicDEK,
} from 'test/values'

const MockedAnalytics = CeloAnalytics as any

jest.mock('src/transactions/send', () => ({
  sendTransaction: jest.fn(),
  sendTransactionPromises: jest.fn(() => ({ confirmation: true, transactionHash: true })),
}))

jest.mock('@celo/react-native-sms-retriever', () => ({
  startSmsRetriever: jest.fn(() => true),
  addSmsListener: jest.fn(),
  removeSmsListener: jest.fn(),
}))

jest.mock('@celo/utils', () => ({
  ...jest.requireActual('@celo/utils'),
  ECIES: { Encrypt: jest.fn(() => Buffer.from('0', 'hex')) },
  SignatureUtils: { parseSignature: jest.fn(() => ({ r: 'r', s: 's', v: 'v' })) },
}))

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

const attestationCode0: AttestationCode = {
  code:
    'ab8049b95ac02e989aae8b61fddc10fe9b3ac3c6aebcd3e68be495570b2d3da15aabc691ab88de69648f988fab653ac943f67404e532cfd1013627f56365f36501',
  issuer: '848920b14154b6508b8d98e7ee8159aa84b579a4',
}

const attestationCode1: AttestationCode = {
  code:
    '2033a9e1268576bf5dfee354a37480529d71f99be82c05005ffb71c7d742d10e7a9aa01f8acc4d7998e1e8b183cf6b8cb4d4a8d923fecfddd191e61e074adc5e00',
  issuer: 'fdb8da92c3597e81c2737e8be793bee9f1172045',
}

const attestationCode2: AttestationCode = {
  code:
    '1930a9e1268576bf5dfee354a37480529d71f99be82c05005ffb71c7d742d10e7a9aa01f8acc4d7993f75ab183cf6b8cb4d4a8d923fecfddd191e61e074adc5a10',
  issuer: 'ecb8da92c3597e81c2737e8be793bee9f1173156',
}

const attestationCodes = [attestationCode0, attestationCode1, attestationCode2]

const stubUserVerified = {
  getAttestationStats: [3, 3],
}

const stubUserUnverified = {
  request: null,
  reveal: null,
  getAttestationRequestFee: Math.pow(10, 18),
  getAttestationStats: [0, 0],
  attestationExpirySeconds: '86400', // 1 day
  getAttestationIssuers: [
    attestationCode0.issuer,
    attestationCode1.issuer,
    attestationCode2.issuer,
  ],
  getAttestationState: [AttestationState.Incomplete, Date.now()],
  getWalletAddress: mockAccount2,
  getDataEncryptionKey: mockPublicDEK,
  setAccount: null,
  validateAttestationCode: true,
  complete: null,
}

const stubUserPartlyVerified = {
  ...stubUserUnverified,
  getAttestationIssuers: [attestationCode0.issuer],
  getAttestationStats: [2, 3],
}

const stableTokenStub = {
  approve: null,
}

describe('Start Verification Saga', () => {
  beforeEach(() => {
    MockedAnalytics.startTracking.mockReset()
    MockedAnalytics.stopTracking.mockReset()
    MockedAnalytics.track.mockReset()
  })
  it('tracks failure', async () => {
    await expectSaga(startVerification)
      .provide([[call(getConnectedAccount), null], [call(doVerificationFlow), false]])
      .run()
    expect(MockedAnalytics.track.mock.calls.length).toBe(1)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(CustomEventNames.verification_failed)
  })

  it('times out when verification takes too long', async () => {
    await expectSaga(startVerification)
      .provide([
        [call(getConnectedAccount), null],
        [call(doVerificationFlow), sleep(1500)],
        [delay(VERIFICATION_TIMEOUT), 1000],
      ])
      .run(2000)
    expect(MockedAnalytics.track.mock.calls.length).toBe(2)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(CustomEventNames.verification_timed_out)
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(DefaultEventNames.errorDisplayed)
  })

  it('stops when the user cancels', async () => {
    await expectSaga(startVerification)
      .provide([[call(getConnectedAccount), null], [call(doVerificationFlow), sleep(1500)]])
      .dispatch(cancelVerification())
      .run(2000)
    expect(MockedAnalytics.track.mock.calls.length).toBe(1)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(CustomEventNames.verification_cancelled)
  })
})

describe('Do Verification Saga', () => {
  it('succeeds for unverified users', async () => {
    const attestationContract = createMockContract(stubUserUnverified)
    await expectSaga(doVerificationFlow)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(privateCommentKeySelector), mockPrivateDEK.toString('hex')],
        [call(getAttestationsContract, web3), attestationContract],
        [call(getStableTokenContract, web3), createMockContract(stableTokenStub)],
        [select(e164NumberSelector), mockE164Number],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
      ])
      .put(completeAttestationCode())
      .put(completeAttestationCode())
      .put(completeAttestationCode())
      .put(endVerification())
      .put(setNumberVerified(true))
      .returns(true)
      .run()
  })

  it('succeeds for partly verified users', async () => {
    const attestationContract = createMockContract(stubUserPartlyVerified)
    await expectSaga(doVerificationFlow)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(privateCommentKeySelector), mockPrivateDEK.toString('hex')],
        [call(getAttestationsContract, web3), attestationContract],
        [call(getStableTokenContract, web3), createMockContract(stableTokenStub)],
        [select(e164NumberSelector), mockE164Number],
        [select(attestationCodesSelector), attestationCodes],
      ])
      .put(completeAttestationCode())
      .put(endVerification())
      .put(setNumberVerified(true))
      .returns(true)
      .run()
  })

  it('succeeds for verified users', async () => {
    const attestationContract = createMockContract(stubUserVerified)
    await expectSaga(doVerificationFlow)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(privateCommentKeySelector), mockPrivateDEK.toString('hex')],
        [call(getAttestationsContract, web3), attestationContract],
        [call(getStableTokenContract, web3), createMockContract({})],
        [select(e164NumberSelector), mockE164Number],
      ])
      .put(endVerification())
      .put(setNumberVerified(true))
      .returns(true)
      .run()
  })

  it('shows errors on failure', async () => {
    const attestationContract = createMockContract(stubUserUnverified)
    await expectSaga(doVerificationFlow)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(privateCommentKeySelector), mockPrivateDEK.toString('hex')],
        [call(getAttestationsContract, web3), attestationContract],
        [call(getStableTokenContract, web3), createMockContract({})],
        [select(e164NumberSelector), mockE164Number],
        [matchers.call.fn(requestAndRetrieveAttestations), throwError(new Error('fake error'))],
      ])
      .put(showError(ErrorMessages.VERIFICATION_FAILURE, ERROR_DURATION))
      .put(endVerification(false))
      .returns(false)
      .run()
  })
})
