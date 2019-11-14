import { REHYDRATE } from 'redux-persist/es/constants'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { getPincode } from 'src/account/saga'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { finishPinVerification, startPinVerification } from 'src/app/actions'
import {
  checkAppDeprecation,
  navigatePinProtected,
  navigateToProperScreen,
  waitForRehydrate,
} from 'src/app/saga'
import { isAppVersionDeprecated } from 'src/firebase/firebase'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { NavActions, navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'
import { web3 } from 'src/web3/contracts'
import { getAccount } from 'src/web3/saga'
import { zeroSyncSelector } from 'src/web3/selectors'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

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
    await expectSaga(checkAppDeprecation)
      .provide([[call(waitForRehydrate), null], [call(isAppVersionDeprecated), true]])
      .run()
    expect(navigate).toHaveBeenCalledWith(Screens.UpgradeScreen)
  })

  it('Version Not Deprecated', async () => {
    await expectSaga(checkAppDeprecation)
      .provide([[call(waitForRehydrate), null], [call(isAppVersionDeprecated), false]])
      .run()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('Navigates after verifying PIN - Forno', async () => {
    const testRoute = { routeName: 'test', params: { a: '1' } }
    await expectSaga(navigatePinProtected, testRoute)
      .provide([[select(zeroSyncSelector), true]])
      .run()
    expect(navigate).toHaveBeenCalledWith(testRoute.routeName, testRoute.params)
  })

  it('Navigates after verifying PIN - Light node', async () => {
    const testRoute = { routeName: 'test', params: { a: '1' } }
    await expectSaga(navigatePinProtected, testRoute)
      .provide([
        [select(zeroSyncSelector), false],
        [call(getPincode, false), '123456'],
        [call(getAccount), 'account'],
        [call(web3.eth.personal.unlockAccount, 'account', '123456', UNLOCK_DURATION), undefined],
      ])
      .put(startPinVerification())
      .put(finishPinVerification())
      .run()
    expect(navigate).toHaveBeenCalledWith(testRoute.routeName, testRoute.params)
  })
})

navigationSagaTest('Navigates to the nux stack with no state', null, Stacks.NuxStack)
navigationSagaTest('Navigates to the nux stack with no language', initialState, Stacks.NuxStack)
