import { ActionableAttestation } from '@celo/contractkit/lib/wrappers/Attestations'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, delay, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { AppEvents, VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setNumberVerified } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import {
  cancelVerification,
  completeAttestationCode,
  reportRevealStatus,
  resendAttestations,
  setCompletedCodes,
  setVerificationStatus,
  startVerification,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { attestationCodesSelector, e164NumberToSaltSelector } from 'src/identity/reducer'
import { VerificationStatus } from 'src/identity/types'
import {
  AttestationCode,
  doVerificationFlowSaga,
  MAX_ACTIONABLE_ATTESTATIONS,
  NUM_ATTESTATIONS_REQUIRED,
  reportActionableAttestationsStatuses,
  reportRevealStatusSaga,
  startVerificationSaga,
  VERIFICATION_TIMEOUT,
} from 'src/identity/verification'
import {
  actionableAttestationsSelector,
  doVerificationFlow,
  fail,
  idle,
  komenciContextSelector,
  phoneHashSelector,
  setOverrideWithoutVerification,
  shouldUseKomenciSelector,
  start,
  State as VerificationState,
  succeed,
  verificationStatusSelector,
} from 'src/verify/reducer'
import { getContractKitAsync } from 'src/web3/contracts'
import { getConnectedUnlockedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'
import {
  mockAccount,
  mockAccount2,
  mockE164Number,
  mockE164NumberHash,
  mockE164NumberPepper,
  mockPublicDEK,
} from 'test/values'

const MockedAnalytics = ValoraAnalytics as any

jest.mock('src/web3/saga', () => ({
  ...jest.requireActual('src/web3/saga'),
  unlockAccount: jest.fn(),
}))

const mockUnlockAccount = unlockAccount as jest.MockedFunction<typeof unlockAccount>
mockUnlockAccount.mockImplementation(function*() {
  return UnlockResult.SUCCESS
})

jest.mock('src/transactions/send', () => ({
  sendTransaction: jest.fn(),
  sendTransactionPromises: jest.fn(() => ({
    confirmation: true,
    transactionHash: true,
    receipt: true,
  })),
}))

jest.mock('@celo/react-native-sms-retriever', () => ({
  startSmsRetriever: jest.fn(() => true),
  addSmsListener: jest.fn(),
  removeSmsListener: jest.fn(),
}))

jest.mock('@celo/utils', () => {
  const mockParseSig = jest.fn(() => ({ r: 'r', s: 's', v: 'v' }))
  return {
    ...jest.requireActual('@celo/utils'),
    ECIES: { Encrypt: jest.fn(() => Buffer.from('0', 'hex')) },
    SignatureUtils: { parseSignature: mockParseSig, parseSignatureWithoutPrefix: mockParseSig },
  }
})

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

const mockContractKitTxObject = { txo: {} }

const mockE164NumberToSalt = {
  [mockE164Number]: mockE164NumberPepper,
}

const mockActionableAttestations: ActionableAttestation[] = [
  {
    issuer: attestationCode0.issuer,
    blockNumber: 100,
    attestationServiceURL: 'https://fake.celo.org/0',
    name: '',
    version: '1.1.0',
  },
  {
    issuer: attestationCode1.issuer,
    blockNumber: 110,
    attestationServiceURL: 'https://fake.celo.org/1',
    name: '',
    version: '1.1.0',
  },
  {
    issuer: attestationCode2.issuer,
    blockNumber: 120,
    attestationServiceURL: 'https://fake.celo.org/2',
    name: '',
    version: '1.1.0',
  },
]

const mockAttestationsWrapperUnverified = {
  getVerifiedStatus: jest.fn(() => ({
    isVerified: false,
    numAttestationsRemaining: mockAttestationsRemainingForUnverified,
    total: 0,
    completed: 0,
  })),
  getActionableAttestations: jest
    .fn()
    .mockImplementationOnce(() => [])
    .mockImplementationOnce(() => mockActionableAttestations),
  getUnselectedRequest: jest.fn(() => ({ blockNumber: 0 })),
  approveAttestationFee: jest.fn(() => mockContractKitTxObject),
  request: jest.fn(() => mockContractKitTxObject),
  waitForSelectingIssuers: jest.fn(),
  selectIssuers: jest.fn(() => mockContractKitTxObject),
  findMatchingIssuer: jest.fn(() => 'mockIssuer'),
  validateAttestationCode: jest.fn(() => true),
  revealPhoneNumberToIssuer: jest.fn(() => ({ ok: true, statusCode: 'good', json: () => ({}) })),
  complete: jest.fn(() => mockContractKitTxObject),
}

const mockAttestationsRemainingForUnverified = NUM_ATTESTATIONS_REQUIRED
const mockAttestationsRemainingForPartialVerified = 1

const mockAttestationsWrapperPartlyVerified = {
  ...mockAttestationsWrapperUnverified,
  getVerifiedStatus: jest.fn(() => ({
    isVerified: false,
    numAttestationsRemaining: mockAttestationsRemainingForPartialVerified,
    total: 3,
    completed: 2,
  })),
  getActionableAttestations: jest.fn(() => [mockActionableAttestations[0]]),
  lookupAccountsForIdentifier: jest.fn(() => [mockAccount]),
}

const mockAttestationsWrapperPartlyVerifiedNonAssociated = {
  ...mockAttestationsWrapperUnverified,
  getVerifiedStatus: jest.fn(() => ({
    isVerified: false,
    numAttestationsRemaining: mockAttestationsRemainingForPartialVerified,
    total: 3,
    completed: 2,
  })),
  getActionableAttestations: jest.fn(() => [mockActionableAttestations[0]]),
  lookupAccountsForIdentifier: jest.fn(() => [mockAccount2]),
}

const mockAccountsWrapper = {
  getWalletAddress: jest.fn(() => Promise.resolve(mockAccount)),
  getDataEncryptionKey: jest.fn(() => Promise.resolve(mockPublicDEK)),
}

const mockVerificationState: VerificationState = {
  komenci: {
    errorTimestamps: [],
    unverifiedMtwAddress: null,
    sessionActive: false,
    sessionToken: '',
    callbackUrl: undefined,
    captchaToken: '',
  },
  status: {
    isVerified: false,
    numAttestationsRemaining: 3,
    total: 0,
    completed: 0,
    komenci: true,
  },
  actionableAttestations: [],
  retries: 0,
  currentState: idle(),
  komenciAvailable: undefined,
  TEMPORAR_override_withoutVerification: undefined,
  phoneHash: mockE164NumberHash,
  e164Number: mockE164Number,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe(startVerificationSaga, () => {
  beforeEach(() => {
    MockedAnalytics.track.mockReset()
  })
  it('succeeds', async () => {
    const withoutRevealing = false
    await expectSaga(startVerificationSaga, { withoutRevealing })
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(reportActionableAttestationsStatuses), null],
      ])
      .put(setOverrideWithoutVerification(withoutRevealing))
      .put(start({ e164Number: mockE164Number, withoutRevealing }))
      .dispatch(succeed())
      .run()
    expect(MockedAnalytics.track.mock.calls.length).toBe(2)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(VerificationEvents.verification_start)
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(VerificationEvents.verification_complete)
  })
  it('restarts', async () => {
    const withoutRevealing = true
    const numAttestationsRemaining = 3
    await expectSaga(startVerificationSaga, { withoutRevealing })
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [select(verificationStatusSelector), { numAttestationsRemaining }],
        [call(reportActionableAttestationsStatuses), null],
      ])
      .put(setOverrideWithoutVerification(withoutRevealing))
      .put(start({ e164Number: mockE164Number, withoutRevealing }))
      .put(startVerification(mockE164Number, false))
      .dispatch(resendAttestations())
      .run()
    expect(MockedAnalytics.track.mock.calls.length).toBe(2)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(VerificationEvents.verification_start)
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(
      VerificationEvents.verification_resend_messages
    )
    expect(MockedAnalytics.track.mock.calls[1][1]).toStrictEqual({
      count: numAttestationsRemaining,
    })
  })
  it('tracks failure', async () => {
    const withoutRevealing = false
    const errorMessage = 'This is an error message'
    await expectSaga(startVerificationSaga, { withoutRevealing })
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(reportActionableAttestationsStatuses), null],
      ])
      .put(setOverrideWithoutVerification(withoutRevealing))
      .put(start({ e164Number: mockE164Number, withoutRevealing }))
      .dispatch(fail(errorMessage))
      .run()
    expect(MockedAnalytics.track.mock.calls.length).toBe(2)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(VerificationEvents.verification_start)
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(VerificationEvents.verification_error)
    expect(MockedAnalytics.track.mock.calls[1][1]).toStrictEqual({ error: errorMessage })
  })

  it('times out when verification takes too long', async () => {
    await expectSaga(startVerificationSaga, { withoutRevealing: false })
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [delay(VERIFICATION_TIMEOUT), true],
        [call(reportActionableAttestationsStatuses), null],
      ])
      .run(2000)
    expect(MockedAnalytics.track.mock.calls.length).toBe(3)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(VerificationEvents.verification_start)
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(VerificationEvents.verification_timeout)
    expect(MockedAnalytics.track.mock.calls[2][0]).toBe(AppEvents.error_displayed)
  })

  it('stops when the user cancels', async () => {
    await expectSaga(startVerificationSaga, { withoutRevealing: false })
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(reportActionableAttestationsStatuses), null],
      ])
      .dispatch(cancelVerification())
      .run(2000)
    expect(MockedAnalytics.track.mock.calls.length).toBe(2)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(VerificationEvents.verification_start)
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(VerificationEvents.verification_cancel)
  })
})

describe(doVerificationFlowSaga, () => {
  it('succeeds for unverified users', async () => {
    const contractKit = await getContractKitAsync()
    const mockAttestationsWrapperLocal = {
      ...mockAttestationsWrapperUnverified,
      getActionableAttestations: jest.fn(() => mockActionableAttestations),
    }

    await expectSaga(doVerificationFlowSaga, doVerificationFlow(false))
      .provide([
        [select(shouldUseKomenciSelector), false],
        [select(e164NumberToSaltSelector), mockE164NumberToSalt],
        [select(e164NumberSelector), mockE164Number],
        [select(phoneHashSelector), mockE164NumberHash],
        [select(verificationStatusSelector), mockVerificationState.status],
        [select(komenciContextSelector), mockVerificationState.komenci],
        [select(actionableAttestationsSelector), mockVerificationState.actionableAttestations],
        [call(getConnectedUnlockedAccount), mockAccount],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperLocal,
        ],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
      ])
      .put(setVerificationStatus(VerificationStatus.Prepping))
      .put(setCompletedCodes(0))
      .put(setVerificationStatus(VerificationStatus.CompletingAttestations))
      .put(completeAttestationCode(attestationCode0))
      .put(
        reportRevealStatus(
          mockActionableAttestations[0].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[0].issuer,
          mockVerificationState.e164Number!,
          mockE164NumberPepper
        )
      )
      .put(completeAttestationCode(attestationCode1))
      .put(
        reportRevealStatus(
          mockActionableAttestations[1].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[1].issuer,
          mockVerificationState.e164Number!,
          mockE164NumberPepper
        )
      )
      .put(completeAttestationCode(attestationCode2))
      .put(
        reportRevealStatus(
          mockActionableAttestations[2].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[2].issuer,
          mockVerificationState.e164Number!,
          mockE164NumberPepper
        )
      )
      .put(succeed())
      .put(setVerificationStatus(VerificationStatus.Done))
      .put(setNumberVerified(true))
      .run()
  })

  it('succeeds for partly verified users', async () => {
    const contractKit = await getContractKitAsync()
    const mockVerificationStatePartlyVerified = {
      ...mockVerificationState,
      status: {
        ...mockVerificationState,
        numAttestationsRemaining: 1,
        total: 3,
        completed: 2,
        komenci: false,
      },
    }
    await expectSaga(doVerificationFlowSaga, doVerificationFlow(false))
      .provide([
        [select(shouldUseKomenciSelector), false],
        [select(e164NumberToSaltSelector), mockE164NumberToSalt],
        [select(e164NumberSelector), mockE164Number],
        [select(phoneHashSelector), mockE164NumberHash],
        [select(verificationStatusSelector), mockVerificationStatePartlyVerified.status],
        [select(komenciContextSelector), mockVerificationState.komenci],
        [select(actionableAttestationsSelector), mockVerificationState.actionableAttestations],
        [call(getConnectedUnlockedAccount), mockAccount],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperPartlyVerified,
        ],
        [select(attestationCodesSelector), attestationCodes],
      ])
      .put(setCompletedCodes(2))
      .put(completeAttestationCode(attestationCode0))
      .put(
        reportRevealStatus(
          mockActionableAttestations[0].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[0].issuer,
          mockVerificationState.e164Number!,
          mockE164NumberPepper
        )
      )
      .put(succeed())
      .put(setVerificationStatus(VerificationStatus.Done))
      .put(setNumberVerified(true))
      .run()
  })

  it('show error when attempting to reverify a previously revoked account', async () => {
    const contractKit = await getContractKitAsync()
    const mockVerificationStatePartlyVerified = {
      ...mockVerificationState,
      status: {
        ...mockVerificationState,
        numAttestationsRemaining: 1,
        total: 3,
        completed: 2,
        komenci: false,
      },
    }
    await expectSaga(doVerificationFlowSaga, doVerificationFlow(false))
      .provide([
        [select(shouldUseKomenciSelector), false],
        [select(e164NumberToSaltSelector), mockE164NumberToSalt],
        [select(e164NumberSelector), mockE164Number],
        [select(phoneHashSelector), mockE164NumberHash],
        [select(verificationStatusSelector), mockVerificationStatePartlyVerified.status],
        [select(komenciContextSelector), mockVerificationState.komenci],
        [select(actionableAttestationsSelector), mockVerificationState.actionableAttestations],
        [call(getConnectedUnlockedAccount), mockAccount],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperPartlyVerifiedNonAssociated,
        ],
      ])
      .put(setVerificationStatus(VerificationStatus.Prepping))
      .put(showError(ErrorMessages.CANT_VERIFY_REVOKED_ACCOUNT, 10000))
      .put(setVerificationStatus(VerificationStatus.Failed))
      .put(fail(ErrorMessages.CANT_VERIFY_REVOKED_ACCOUNT))
      .run()
  })

  it('succeeds for verified users', async () => {
    await expectSaga(doVerificationFlowSaga, doVerificationFlow(false))
      .provide([
        [select(shouldUseKomenciSelector), false],
        [select(e164NumberToSaltSelector), mockE164NumberToSalt],
        [select(e164NumberSelector), mockE164Number],
        [select(phoneHashSelector), mockE164NumberHash],
        [select(verificationStatusSelector), { isVerified: true }],
        [select(komenciContextSelector), mockVerificationState.komenci],
        [select(actionableAttestationsSelector), mockVerificationState.actionableAttestations],
        [call(getConnectedUnlockedAccount), mockAccount],
      ])
      .put(setVerificationStatus(VerificationStatus.Prepping))
      .put(setVerificationStatus(VerificationStatus.Done))
      .put(setNumberVerified(true))
      .put(succeed())
      .run()
  })

  it('shows error on unexpected failure', async () => {
    await expectSaga(doVerificationFlowSaga, doVerificationFlow(false))
      .provide([
        [select(shouldUseKomenciSelector), false],
        [select(e164NumberToSaltSelector), mockE164NumberToSalt],
        [select(e164NumberSelector), mockE164Number],
        [select(phoneHashSelector), mockE164NumberHash],
        [select(verificationStatusSelector), mockVerificationState.status],
        [select(komenciContextSelector), mockVerificationState.komenci],
        [select(actionableAttestationsSelector), mockVerificationState.actionableAttestations],
        [call(getConnectedUnlockedAccount), throwError(new Error('fake error'))],
      ])
      .put(showError(ErrorMessages.VERIFICATION_FAILURE))
      .put(setVerificationStatus(VerificationStatus.Failed))
      .put(fail('fake error'))
      .run()
  })

  it(`fails if more than ${MAX_ACTIONABLE_ATTESTATIONS} actionable attestaions exceeded`, async () => {
    const mockAttestationsWrapperRevealFailed = {
      ...mockAttestationsWrapperUnverified,
      revealPhoneNumberToIssuer: jest.fn(() => ({
        ok: false,
        status: 'bad',
        json: () => ({}),
      })),

      getActionableAttestations: jest.fn(() => mockActionableAttestations),
    }

    const contractKit = await getContractKitAsync()

    await expectSaga(doVerificationFlowSaga, doVerificationFlow(false))
      .provide([
        [select(shouldUseKomenciSelector), false],
        [select(e164NumberToSaltSelector), mockE164NumberToSalt],
        [select(e164NumberSelector), mockE164Number],
        [select(phoneHashSelector), mockE164NumberHash],
        [select(verificationStatusSelector), mockVerificationState.status],
        [select(komenciContextSelector), mockVerificationState.komenci],
        [select(actionableAttestationsSelector), mockActionableAttestations],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(currentLanguageSelector), 'us-en'],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperRevealFailed,
        ],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
      ])
      .put(setVerificationStatus(VerificationStatus.Failed))
      .put(fail(ErrorMessages.MAX_ACTIONABLE_ATTESTATIONS_EXCEEDED))
      .run()
  })
})

describe(reportActionableAttestationsStatuses, () => {
  it('report actionable attestations', async () => {
    const contractKit = await getContractKitAsync()
    const mockAttestationsWrapper = {
      ...mockAttestationsWrapperUnverified,
      getActionableAttestations: jest.fn(() => mockActionableAttestations),
    }
    await expectSaga(reportActionableAttestationsStatuses)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(e164NumberSelector), mockE164Number],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [call([contractKit.contracts, contractKit.contracts.getAccounts]), mockAccountsWrapper],
        [
          call(fetchPhoneHashPrivate, mockE164Number),
          {
            phoneHash: mockE164NumberHash,
            e164Number: mockE164Number,
            pepper: mockE164NumberPepper,
          },
        ],
      ])
      .put(
        reportRevealStatus(
          mockActionableAttestations[0].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[0].issuer,
          mockVerificationState.e164Number!,
          mockE164NumberPepper
        )
      )
      .put(
        reportRevealStatus(
          mockActionableAttestations[1].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[1].issuer,
          mockVerificationState.e164Number!,
          mockE164NumberPepper
        )
      )
      .put(
        reportRevealStatus(
          mockActionableAttestations[2].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[2].issuer,
          mockVerificationState.e164Number!,
          mockE164NumberPepper
        )
      )
      .run()
  })
})

describe(reportRevealStatusSaga, () => {
  beforeEach(() => {
    MockedAnalytics.track.mockReset()
  })
  it('report actionable attestation to analytics', async () => {
    const contractKit = await getContractKitAsync()
    const mockAttestationsWrapper = {
      ...mockAttestationsWrapperUnverified,
      getRevealStatus: jest.fn(() => ({
        ok: true,
        json: () => body,
      })),
    }
    const mockIssuer = mockActionableAttestations[0].issuer
    const body = { issuer: mockIssuer, custom: 'payload' }
    await expectSaga(reportRevealStatusSaga, {
      attestationServiceUrl: 'url',
      e164Number: mockE164Number,
      account: mockAccount,
      issuer: mockIssuer,
      pepper: mockE164NumberPepper,
    })
      .provide([
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
      ])
      .run()
    expect(MockedAnalytics.track.mock.calls.length).toBe(1)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(
      VerificationEvents.verification_reveal_attestation_status
    )
    expect(MockedAnalytics.track.mock.calls[0][1]).toStrictEqual(body)
  })
})
