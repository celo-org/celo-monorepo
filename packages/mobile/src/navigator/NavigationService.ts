// (https://github.com/react-navigation/react-navigation/issues/1439)
import {
  NavigationActions,
  NavigationContainerComponent,
  NavigationParams,
  NavigationState,
} from 'react-navigation'
import sleep from 'sleep-promise'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

const TAG = 'NavigationService'

export enum NavActions {
  SET_NAVIGATOR = 'NAVIGATION/SET_NAVIGATOR',
}

let navigator: NavigationContainerComponent

export const setTopLevelNavigator = (navigatorRef: any) => {
  Logger.debug(`${TAG}@setTopLevelNavigator`, 'Initialized')
  navigator = navigatorRef
  return {
    type: NavActions.SET_NAVIGATOR,
  }
}

export function navigate(routeName: string, params?: NavigationParams) {
  waitForNavigator()
    .then(() => {
      if (!navigator) {
        Logger.error(`${TAG}@navigate`, 'Cannot navigate yet, navigator is not initialized')
        return
      }

      Logger.debug(`${TAG}@navigate`, `Dispatch ${routeName}`)
      navigator.dispatch(
        NavigationActions.navigate({
          routeName,
          params,
        })
      )
    })
    .catch((reason) => {
      Logger.error(`${TAG}@navigate`, `Navigation failure: ${reason}`)
    })
}

// Source: https://v1.reactnavigation.org/docs/screen-tracking.html
export function recordStateChange(prevState: NavigationState, currentState: NavigationState) {
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

export function navigateBack() {
  navigator.dispatch(NavigationActions.back())
}

export function navigateHome(params?: NavigationParams) {
  navigate(Screens.WalletHome, params)
}

export function navigateToError(errorMessage: string, error?: Error) {
  Logger.error(`${TAG}@navigateToError`, `Navigating to error screen: ${errorMessage}`, error)
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
