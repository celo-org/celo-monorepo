import { REHYDRATE } from 'redux-persist/es/constants'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { openDeepLink } from 'src/app/actions'
import { handleDeepLink, navigateToProperScreen } from 'src/app/saga'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { isAppVersionDeprecated } from 'src/firebase/firebase'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import { NavActions, navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

jest.mock('src/dappkit/dappkit')

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

const navigationSagaTest = (testName: string, state: any, expectedScreen: any) => {
  test(testName, async () => {
    await expectSaga(navigateToProperScreen)
      .withState(state)
      .dispatch({ type: REHYDRATE })
      .dispatch({ type: NavActions.SET_NAVIGATOR })
      .provide([[call(isAppVersionDeprecated), false]])
      .run()
    expect(navigate).toHaveBeenCalledWith(expectedScreen)
  })
}

describe('App saga', () => {
  beforeEach(() => {
    MockedAnalytics.track = jest.fn()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Version Deprecated', async () => {
    await expectSaga(navigateToProperScreen)
      .dispatch({ type: REHYDRATE })
      .dispatch({ type: NavActions.SET_NAVIGATOR })
      .provide([[call(isAppVersionDeprecated), true]])
      .run()
    expect(navigate).toHaveBeenCalledWith(Screens.UpgradeScreen)
  })

  it('Handles Dappkit deep link', async () => {
    const deepLink = 'celo://wallet/dappkit?abcdsa'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(handleDappkitDeepLink).toHaveBeenCalledWith(deepLink)
  })

  it('Handles verification deep link', async () => {
    await expectSaga(handleDeepLink, openDeepLink('celo://wallet/v/12345'))
      .put(receiveAttestationMessage('12345', CodeInputType.DEEP_LINK))
      .run()
  })
})

navigationSagaTest('Navigates to the nux stack with no state', null, Stacks.NuxStack)
navigationSagaTest('Navigates to the nux stack with no language', initialState, Stacks.NuxStack)
