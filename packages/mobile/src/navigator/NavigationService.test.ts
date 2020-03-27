import SplashScreen from 'react-native-splash-screen'
import { NavigationState } from 'react-navigation'
import { handleNavigationStateChange } from 'src/navigator/NavigationService'

jest.unmock('src/navigator/NavigationService')

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
