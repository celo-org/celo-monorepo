import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { appLock, openDeepLink, setAppState } from 'src/app/actions'
import { handleDeepLink, handleSetAppState } from 'src/app/saga'
import { getAppLocked, getLastTimeBackgrounded, getRequirePinOnAppOpen } from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

jest.mock('src/dappkit/dappkit')

const MockedAnalytics = ValoraAnalytics as any

describe('App saga', () => {
  beforeEach(() => {
    MockedAnalytics.track = jest.fn()
  })
  afterEach(() => {
    jest.clearAllMocks()
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

  it('Handles set app state', async () => {
    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), true],
      ])
      .put(appLock())
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), true],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), true],
      ])
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), Date.now()],
        [select(getRequirePinOnAppOpen), true],
      ])
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), false],
      ])
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), true],
      ])
      .run()
  })
})
