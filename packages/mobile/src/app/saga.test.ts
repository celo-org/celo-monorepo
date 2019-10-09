import { REHYDRATE } from 'redux-persist/es/constants'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { checkAppDeprecation, navigateToProperScreen, waitForRehydrate } from 'src/app/saga'
import { waitForFirebaseAuth } from 'src/firebase/saga'
import { NavActions } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'
jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))
jest.mock('src/navigator/NavigationService', () => ({
  ...jest.requireActual('src/navigator/NavigationService'),
  navigate: jest.fn(),
}))
jest.mock('src/firebase/firebase', () => ({
  ...jest.requireActual('src/firebase/firebase'),
  getVersionInfo: jest.fn(async () => ({ deprecated: false })),
}))

const { navigate } = require('src/navigator/NavigationService')
const { getVersionInfo } = require('src/firebase/firebase')

const MockedAnalytics = CeloAnalytics as any

const initialState = {
  app: {
    language: undefined,
  },
  verify: {},
  web3: {},
  account: {},
  invite: {},
  identity: {},
}

const numberVerified = {
  app: {
    language: 'EN',
    numberVerified: false,
  },
  verify: {
    e164PhoneNumber: '+1234',
  },
  web3: {
    syncProgress: 101,
  },
  account: {
    pincodeType: PincodeType.PhoneAuth,
    e164PhoneNumber: '+1234',
  },
  invite: {
    redeemComplete: true,
  },
  identity: {
    startedVerification: false,
    askedContactsPermission: true,
  },
}

const navigationSagaTest = (testName: string, state: any, expectedScreen: any) => {
  test(testName, async () => {
    navigate.mockClear()
    await expectSaga(navigateToProperScreen)
      .withState(state)
      .dispatch({ type: REHYDRATE })
      .dispatch({ type: NavActions.SET_NAVIGATOR })
      .run()
    expect(navigate).toHaveBeenCalledWith(expectedScreen)
  })
}

describe('Upload Comment Key Saga', () => {
  beforeEach(() => {
    MockedAnalytics.track = jest.fn()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Version Deprecated', async () => {
    getVersionInfo.mockImplementationOnce(async () => ({ deprecated: true }))
    await expectSaga(checkAppDeprecation)
      .provide([[call(waitForRehydrate), null], [call(waitForFirebaseAuth), null]])
      .run()
    expect(navigate).toHaveBeenCalledWith(Screens.UpgradeScreen)
  })

  it('Version Not Deprecated', async () => {
    await expectSaga(checkAppDeprecation)
      .provide([[call(waitForRehydrate), null], [call(waitForFirebaseAuth), null]])
      .run()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('Version info is not set', async () => {
    getVersionInfo.mockImplementationOnce(async () => null)
    await expectSaga(checkAppDeprecation)
      .provide([[call(waitForRehydrate), null], [call(waitForFirebaseAuth), null]])
      .run()
    expect(navigate).not.toHaveBeenCalled()
  })
})

navigationSagaTest('Navigates to the nux stack with no state', null, Stacks.NuxStack)
navigationSagaTest('Navigates to the nux stack with no language', initialState, Stacks.NuxStack)

navigationSagaTest('Navigates to the verify screen', numberVerified, Screens.VerifyEducation)
