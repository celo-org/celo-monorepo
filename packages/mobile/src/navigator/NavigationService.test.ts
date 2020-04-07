import SplashScreen from 'react-native-splash-screen'
import { NavigationState } from 'react-navigation'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import {
  handleNavigationStateChange,
  navigateProtected,
  setTopLevelNavigator,
} from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

jest.unmock('src/navigator/NavigationService')

jest.mock('src/account/selectors.ts', () => ({
  ...jest.requireActual('src/account/selectors.ts'),
  pincodeTypeSelector: jest.fn(),
}))

const mockedNavigator = { dispatch: jest.fn() }

// @ts-ignore
jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb())

const hide = SplashScreen.hide as jest.Mock

function createNavStateWithRoute(routeName: string): NavigationState {
  return {
    key: 'root',
    // @ts-ignore
    routes: [{ key: routeName, routeName }],
    index: 0,
    isTransitioning: false,
  }
}

const PREV_STATE = createNavStateWithRoute('InitialScreen')

describe('handleNavigationStateChange', () => {
  it('hides the splash screen after navigating away from AppLoading', () => {
    handleNavigationStateChange(PREV_STATE, createNavStateWithRoute('AppLoading'))
    expect(hide).not.toHaveBeenCalled()

    handleNavigationStateChange(PREV_STATE, createNavStateWithRoute('SomeScreen'))
    expect(hide).toHaveBeenCalled()

    hide.mockClear()

    // Now check we hide only once
    handleNavigationStateChange(PREV_STATE, createNavStateWithRoute('SomeScreen2'))
    expect(hide).not.toHaveBeenCalled()
  })
})

describe('navigateProtected', () => {
  const testParams = { foo: 'bar' }
  it('navigates after ensuring correct PIN using CustomPin', (done) => {
    setTopLevelNavigator(mockedNavigator)
    ;(pincodeTypeSelector as jest.Mock).mockReturnValue(PincodeType.CustomPin)
    ;(mockedNavigator.dispatch as jest.Mock).mockImplementation(({ routeName, params }) => {
      if (routeName === Screens.PincodeEnter) {
        params.onSuccess('123456')
      } else if (routeName === Screens.WalletHome) {
        expect(params).toBe(testParams)
        done()
      }
    })
    navigateProtected(Screens.WalletHome, testParams)
  })

  it('navigates after ensuring correct PIN using PhoneAuth', (done) => {
    mockedNavigator.dispatch.mockClear()
    setTopLevelNavigator(mockedNavigator)
    ;(pincodeTypeSelector as jest.Mock).mockReturnValue(PincodeType.PhoneAuth)
    ;(mockedNavigator.dispatch as jest.Mock).mockImplementation(({ routeName, params }) => {
      if (routeName === Screens.AppLoading) {
        expect(params).toBe(testParams)
        done()
      }
    })
    navigateProtected(Screens.AppLoading, testParams)
  })

  it("doesn't navigate if PIN is unset", (done) => {
    mockedNavigator.dispatch.mockClear()
    setTopLevelNavigator(mockedNavigator)
    ;(pincodeTypeSelector as jest.Mock).mockReturnValue(PincodeType.Unset)
    navigateProtected(Screens.AppLoading, testParams)
    jest.useRealTimers()
    setTimeout(() => {
      expect(mockedNavigator.dispatch).toHaveBeenCalledTimes(0)
      done()
    })
    jest.useFakeTimers()
  })

  it("doesn't navigate if PIN was not ensured", (done) => {
    mockedNavigator.dispatch.mockClear()
    setTopLevelNavigator(mockedNavigator)
    ;(pincodeTypeSelector as jest.Mock).mockReturnValue(PincodeType.CustomPin)
    ;(mockedNavigator.dispatch as jest.Mock).mockImplementation(({ routeName, params }) => {
      if (routeName === Screens.PincodeEnter) {
        params.onSuccess('')
      }
    })
    navigateProtected(Screens.WalletHome, testParams)
    jest.useRealTimers()
    setTimeout(() => {
      expect(mockedNavigator.dispatch).toHaveBeenCalledTimes(1)
      done()
    })
    jest.useFakeTimers()
  })
})
