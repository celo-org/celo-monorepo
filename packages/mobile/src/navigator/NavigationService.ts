// (https://github.com/react-navigation/react-navigation/issues/1439)
import {
  NavigationActions,
  NavigationContainerComponent,
  NavigationParams,
  NavigationState,
  StackActions,
} from 'react-navigation'
import sleep from 'sleep-promise'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

export enum NavActions {
  SET_NAVIGATOR = 'NAVIGATION/SET_NAVIGATOR',
}

let navigator: NavigationContainerComponent

export const setTopLevelNavigator = (navigatorRef: any) => {
  Logger.debug('NavigationService@setTopLevelNavigator', 'Initialized')
  navigator = navigatorRef
  return {
    type: NavActions.SET_NAVIGATOR,
  }
}

export const navigate = async (routeName: string, params?: NavigationParams) => {
  await waitForNavigator()
  if (navigator) {
    Logger.debug('NavigationService@navigate', `Dispatch ${routeName}`)
    navigator.dispatch(
      NavigationActions.navigate({
        routeName,
        params,
      })
    )
  } else {
    Logger.error('NavigationService@navigate', 'Cannot navigate yet, navigator is not initialized')
  }
}

// Source: https://v1.reactnavigation.org/docs/screen-tracking.html
export const recordStateChange = (prevState: NavigationState, currentState: NavigationState) => {
  const getCurrentRouteName = (navState: NavigationState): string => {
    if (!navState) {
      return ''
    }
    const route = navState.routes[navState.index]
    // dive into nested navigators
    // @ts-ignore
    if (route.routes) {
      // @ts-ignore
      return getCurrentRouteName(route)
    }
    return route.routeName
  }
  const currentScreen = getCurrentRouteName(currentState)
  const previousScreen = getCurrentRouteName(prevState)
  CeloAnalytics.page(currentScreen, { previousScreen, currentScreen })
}

export const navigateReset = (routeName: string, params?: NavigationParams) => {
  navigator.dispatch(
    StackActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({
          routeName,
          params,
        }),
      ],
    })
  )
}

export const navigateBack = () => {
  navigator.dispatch(NavigationActions.back())
}

export const navigateHome = () => {
  navigate(Screens.WalletHome)
}

export const navigateToError = (errorMessage: string, error?: Error) => {
  Logger.error('NavigationService', `Navigating to error screen: ${errorMessage}`, error)
  CeloAnalytics.track(DefaultEventNames.errorDisplayed, { error }, true)
  navigate(Screens.ErrorScreen, { errorMessage, error })
}

async function waitForNavigator() {
  let retries = 0
  while (!navigator && retries < 3) {
    await sleep(200)
    retries++
  }
}
