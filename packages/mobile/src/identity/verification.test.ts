import { ActionableAttestation } from '@celo/contractkit/lib/wrappers/Attestations'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { all, call, delay, race, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { AppEvents, VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setNumberVerified } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import {
  Actions,
  cancelVerification,
  completeAttestationCode,
  reportRevealStatus,
  setCompletedCodes,
  setVerificationStatus,
  udpateVerificationState,
} from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import {
  attestationCodesSelector,
  isBalanceSufficientForSigRetrievalSelector,
  isVerificationStateExpiredSelector,
  VerificationState,
  verificationStateSelector,
} from 'src/identity/reducer'
import { VerificationStatus } from 'src/identity/types'
import {
  AttestationCode,
  BALANCE_CHECK_TIMEOUT,
  doVerificationFlow,
  fetchVerificationState,
  MAX_ACTIONABLE_ATTESTATIONS,
  NUM_ATTESTATIONS_REQUIRED,
  reportActionableAttestationsStatuses,
  reportRevealStatusSaga,
  startVerification,
  VERIFICATION_TIMEOUT,
} from 'src/identity/verification'
import { waitFor } from 'src/redux/sagas-helpers'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { dataEncryptionKeySelector } from 'src/web3/selectors'
import { sleep } from 'test/utils'
import {
  mockAccount,
  mockE164Number,
  mockE164NumberHash,
  mockE164NumberPepper,
  mockPrivateDEK,
  mockPublicDEK,
} from 'test/values'

const MockedAnalytics = ValoraAnalytics as any

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

const mockActionableAttestations: ActionableAttestation[] = [
  {
    issuer: attestationCode0.issuer,
    blockNumber: 100,
    attestationServiceURL: 'https://fake.celo.org/0',
    name: '',
  },
  {
    issuer: attestationCode1.issuer,
    blockNumber: 110,
    attestationServiceURL: 'https://fake.celo.org/1',
    name: '',
  },
  {
    issuer: attestationCode2.issuer,
    blockNumber: 120,
    attestationServiceURL: 'https://fake.celo.org/2',
    name: '',
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
}

const mockAccountsWrapper = {
  getWalletAddress: jest.fn(() => Promise.resolve(mockAccount)),
  getDataEncryptionKey: jest.fn(() => Promise.resolve(mockPublicDEK)),
}

const mockVerificationStateUnverified: VerificationState = {
  isLoading: false,
  lastFetch: 1,
  phoneHashDetails: {
    e164Number: mockE164Number,
    phoneHash: mockE164NumberHash,
    pepper: mockE164NumberPepper,
  },
  actionableAttestations: [],
  status: {
    isVerified: false,
    numAttestationsRemaining: 3,
    total: 0,
    completed: 0,
  },
  isBalanceSufficient: true,
}

const mockVerificationStateUnverifiedWithActionableAttestations: VerificationState = {
  isLoading: false,
  lastFetch: 1,
  phoneHashDetails: {
    e164Number: mockE164Number,
    phoneHash: mockE164NumberHash,
    pepper: mockE164NumberPepper,
  },
  actionableAttestations: mockActionableAttestations,
  status: {
    isVerified: false,
    numAttestationsRemaining: 3,
    total: 0,
    completed: 0,
  },
  isBalanceSufficient: true,
}

const mockVerificationStatePartlyVerified: VerificationState = {
  isLoading: false,
  lastFetch: 1,
  phoneHashDetails: {
    e164Number: mockE164Number,
    phoneHash: mockE164NumberHash,
    pepper: mockE164NumberPepper,
  },
  actionableAttestations: [],
  status: {
    isVerified: false,
    numAttestationsRemaining: 1,
    total: 3,
    completed: 2,
  },
  isBalanceSufficient: true,
}

const mockVerificationStateVerified: VerificationState = {
  isLoading: false,
  lastFetch: 1,
  phoneHashDetails: {
    e164Number: mockE164Number,
    phoneHash: mockE164NumberHash,
    pepper: mockE164NumberPepper,
  },
  actionableAttestations: [],
  status: {
    isVerified: true,
    numAttestationsRemaining: 0,
    total: 0,
    completed: 0,
  },
  isBalanceSufficient: true,
}

const mockVerificationStateInsufficientBalance: VerificationState = {
  isLoading: false,
  lastFetch: 1,
  phoneHashDetails: {
    e164Number: mockE164Number,
    phoneHash: mockE164NumberHash,
    pepper: mockE164NumberPepper,
  },
  actionableAttestations: [],
  status: {
    isVerified: false,
    numAttestationsRemaining: 0,
    total: 0,
    completed: 0,
  },
  isBalanceSufficient: false,
}

describe(startVerification, () => {
  beforeEach(() => {
    MockedAnalytics.track.mockReset()
  })
  it('tracks failure', async () => {
    await expectSaga(startVerification, { withoutRevealing: false })
      .provide([
        [call(getConnectedAccount), null],
        [select(isVerificationStateExpiredSelector), false],
        [call(doVerificationFlow, false), 'This is an error message'],
        [call(reportActionableAttestationsStatuses), null],
      ])
      .not.call.fn(fetchVerificationState)
      .run()
    expect(MockedAnalytics.track.mock.calls.length).toBe(2)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(VerificationEvents.verification_start)
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(VerificationEvents.verification_error)
  })

  it('times out when verification takes too long', async () => {
    await expectSaga(startVerification, { withoutRevealing: false })
      .provide([
        [call(getConnectedAccount), null],
        [select(isVerificationStateExpiredSelector), false],
        [call(doVerificationFlow, false), sleep(1500)],
        [call(reportActionableAttestationsStatuses), null],
        [delay(VERIFICATION_TIMEOUT), 1000],
      ])
      .run(2000)
    expect(MockedAnalytics.track.mock.calls.length).toBe(3)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(VerificationEvents.verification_start)
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(VerificationEvents.verification_timeout)
    expect(MockedAnalytics.track.mock.calls[2][0]).toBe(AppEvents.error_displayed)
  })

  it('stops when the user cancels', async () => {
    await expectSaga(startVerification, { withoutRevealing: false })
      .provide([
        [call(getConnectedAccount), null],
        [select(isVerificationStateExpiredSelector), false],
        [call(doVerificationFlow, false), sleep(1500)],
        [call(reportActionableAttestationsStatuses), null],
      ])
      .dispatch(cancelVerification())
      .run(2000)
    expect(MockedAnalytics.track.mock.calls.length).toBe(2)
    expect(MockedAnalytics.track.mock.calls[0][0]).toBe(VerificationEvents.verification_start)
    expect(MockedAnalytics.track.mock.calls[1][0]).toBe(VerificationEvents.verification_cancel)
  })

  it('call fetchVerificationState when verificationState is expired ', async () => {
    await expectSaga(startVerification, { withoutRevealing: false })
      .provide([
        [call(getConnectedAccount), null],
        [select(isVerificationStateExpiredSelector), true],
        [call(doVerificationFlow, false), true],
        // [call(fetchVerificationState), true],
        // [matchers.call.fn(fetchVerificationState), fetchVerificationStateMock],
      ])
      .call.fn(fetchVerificationState)
      .run()
  })
})

describe(fetchVerificationState, () => {
  it('fetches unverified', async () => {
    const contractKit = await getContractKitAsync()
    await expectSaga(fetchVerificationState)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(e164NumberSelector), mockE164Number],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperUnverified,
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
        [
          race({
            balances: all([
              call(waitFor, stableTokenBalanceSelector),
              call(waitFor, celoTokenBalanceSelector),
            ]),
            timeout: delay(BALANCE_CHECK_TIMEOUT),
          }),
          { timeout: false },
        ],
        [select(dataEncryptionKeySelector), mockPrivateDEK],
        [select(isBalanceSufficientForSigRetrievalSelector), true],
      ])
      .put(setVerificationStatus(VerificationStatus.GettingStatus))
      .put(
        udpateVerificationState({
          phoneHashDetails: mockVerificationStateUnverified.phoneHashDetails,
          actionableAttestations: mockVerificationStateUnverified.actionableAttestations,
          status: mockVerificationStateUnverified.status,
        })
      )
      .run()
  })

  it('fetches partly verified', async () => {
    const contractKit = await getContractKitAsync()
    await expectSaga(fetchVerificationState)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(e164NumberSelector), mockE164Number],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperPartlyVerified,
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
        [
          race({
            balances: all([
              call(waitFor, stableTokenBalanceSelector),
              call(waitFor, celoTokenBalanceSelector),
            ]),
            timeout: delay(BALANCE_CHECK_TIMEOUT),
          }),
          { timeout: false },
        ],
        [select(dataEncryptionKeySelector), mockPrivateDEK],
        [select(isBalanceSufficientForSigRetrievalSelector), true],
      ])
      .put(setVerificationStatus(VerificationStatus.GettingStatus))
      .put(
        udpateVerificationState({
          phoneHashDetails: mockVerificationStatePartlyVerified.phoneHashDetails,
          actionableAttestations: [mockActionableAttestations[0]],
          status: mockVerificationStatePartlyVerified.status,
        })
      )
      .run()
  })

  it('catches insufficient balance for sig retrieval', async () => {
    const contractKit = await getContractKitAsync()
    await expectSaga(fetchVerificationState)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(e164NumberSelector), mockE164Number],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperUnverified,
        ],
        [call([contractKit.contracts, contractKit.contracts.getAccounts]), mockAccountsWrapper],
        [
          call(fetchPhoneHashPrivate, mockE164Number),
          { phoneHash: mockE164NumberHash, e164Number: mockE164Number },
        ],
        [
          race({
            balances: all([
              call(waitFor, stableTokenBalanceSelector),
              call(waitFor, celoTokenBalanceSelector),
            ]),
            timeout: delay(BALANCE_CHECK_TIMEOUT),
          }),
          { timeout: false },
        ],
        [select(dataEncryptionKeySelector), mockPrivateDEK],
        [select(isBalanceSufficientForSigRetrievalSelector), false],
      ])
      .not.put.like({ action: { type: Actions.UPDATE_VERIFICATION_STATE } })
      .run()
  })
  it('catches when balances are not fetched', async () => {
    const contractKit = await getContractKitAsync()
    await expectSaga(fetchVerificationState)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(e164NumberSelector), mockE164Number],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperUnverified,
        ],
        [call([contractKit.contracts, contractKit.contracts.getAccounts]), mockAccountsWrapper],
        [
          call(fetchPhoneHashPrivate, mockE164Number),
          { phoneHash: mockE164NumberHash, e164Number: mockE164Number },
        ],
        [
          race({
            balances: all([
              call(waitFor, stableTokenBalanceSelector),
              call(waitFor, celoTokenBalanceSelector),
            ]),
            timeout: delay(BALANCE_CHECK_TIMEOUT),
          }),
          { timeout: true },
        ],
      ])
      .not.put.like({ action: { type: Actions.UPDATE_VERIFICATION_STATE } })
      .run()
  })
})

describe(doVerificationFlow, () => {
  it('succeeds for unverified users', async () => {
    const contractKit = await getContractKitAsync()
    await expectSaga(doVerificationFlow)
      .provide([
        [select(verificationStateSelector), mockVerificationStateUnverified],
        [call(getConnectedUnlockedAccount), mockAccount],
        // TODO (i1skn): remove next two lines when
        // https://github.com/celo-org/celo-labs/issues/578 is resolved
        [delay(5000), true],
        [delay(10000), true],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperUnverified,
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
          mockVerificationStateUnverified.phoneHashDetails.e164Number,
          mockVerificationStateUnverified.phoneHashDetails.pepper
        )
      )
      .put(completeAttestationCode(attestationCode1))
      .put(
        reportRevealStatus(
          mockActionableAttestations[1].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[1].issuer,
          mockVerificationStateUnverified.phoneHashDetails.e164Number,
          mockVerificationStateUnverified.phoneHashDetails.pepper
        )
      )
      .put(completeAttestationCode(attestationCode2))
      .put(
        reportRevealStatus(
          mockActionableAttestations[2].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[2].issuer,
          mockVerificationStateUnverified.phoneHashDetails.e164Number,
          mockVerificationStateUnverified.phoneHashDetails.pepper
        )
      )
      .put(setVerificationStatus(VerificationStatus.Done))
      .put(setNumberVerified(true))
      .returns(true)
      .run()
  })

  it('succeeds for partly verified users', async () => {
    const contractKit = await getContractKitAsync()
    await expectSaga(doVerificationFlow)
      .provide([
        [select(verificationStateSelector), mockVerificationStatePartlyVerified],
        [call(getConnectedUnlockedAccount), mockAccount],
        // TODO (i1skn): remove next two lines when
        // https://github.com/celo-org/celo-labs/issues/578 is resolved
        [delay(5000), true],
        [delay(10000), true],
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
          mockVerificationStateUnverified.phoneHashDetails.e164Number,
          mockVerificationStateUnverified.phoneHashDetails.pepper
        )
      )
      .put(setVerificationStatus(VerificationStatus.Done))
      .put(setNumberVerified(true))
      .returns(true)
      .run()
  })

  it('succeeds for verified users', async () => {
    await expectSaga(doVerificationFlow)
      .provide([[select(verificationStateSelector), mockVerificationStateVerified]])
      .put(setVerificationStatus(VerificationStatus.Prepping))
      .put(setVerificationStatus(VerificationStatus.Done))
      .put(setNumberVerified(true))
      .returns(true)
      .run()
  })

  it('shows error for insufficient balance', async () => {
    const contractKit = await getContractKitAsync()
    await expectSaga(doVerificationFlow)
      .provide([
        [select(verificationStateSelector), mockVerificationStateInsufficientBalance],
        [call(getConnectedUnlockedAccount), mockAccount],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperPartlyVerified,
        ],
      ])
      .put(setVerificationStatus(VerificationStatus.Prepping))
      .put(setVerificationStatus(VerificationStatus.InsufficientBalance))
      .run()
  })

  it('shows error on unexpected failure', async () => {
    await expectSaga(doVerificationFlow)
      .provide([
        [select(verificationStateSelector), mockVerificationStateUnverified],
        [matchers.call.fn(getConnectedUnlockedAccount), throwError(new Error('fake error'))],
      ])
      .put(showError(ErrorMessages.VERIFICATION_FAILURE))
      .put(setVerificationStatus(VerificationStatus.Failed))
      .returns('fake error')
      .run()
  })

  it(`fails if more than ${MAX_ACTIONABLE_ATTESTATIONS} actionable attestaions exceeded`, async () => {
    const mockAttestationsWrapperRevealFailed = {
      ...mockAttestationsWrapperUnverified,
      revealPhoneNumberToIssuer: jest.fn(() => ({
        ok: false,
        statusCode: 'bad',
        json: () => ({}),
      })),

      getActionableAttestations: jest.fn(() => mockActionableAttestations),
    }

    const contractKit = await getContractKitAsync()

    await expectSaga(doVerificationFlow)
      .provide([
        [
          select(verificationStateSelector),
          mockVerificationStateUnverifiedWithActionableAttestations,
        ],
        [call(getConnectedUnlockedAccount), mockAccount],
        // TODO (i1skn): remove next two lines when
        // https://github.com/celo-org/celo-labs/issues/578 is resolved
        [delay(5000), true],
        [delay(10000), true],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapperRevealFailed,
        ],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
        [select(attestationCodesSelector), attestationCodes],
      ])
      .put(setVerificationStatus(VerificationStatus.Failed))
      .returns(ErrorMessages.MAX_ACTIONABLE_ATTESTATIONS_EXCEEDED)
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
          mockVerificationStateUnverified.phoneHashDetails.e164Number,
          mockVerificationStateUnverified.phoneHashDetails.pepper
        )
      )
      .put(
        reportRevealStatus(
          mockActionableAttestations[1].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[1].issuer,
          mockVerificationStateUnverified.phoneHashDetails.e164Number,
          mockVerificationStateUnverified.phoneHashDetails.pepper
        )
      )
      .put(
        reportRevealStatus(
          mockActionableAttestations[2].attestationServiceURL,
          mockAccount,
          mockActionableAttestations[2].issuer,
          mockVerificationStateUnverified.phoneHashDetails.e164Number,
          mockVerificationStateUnverified.phoneHashDetails.pepper
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
