// (https://github.com/react-navigation/react-navigation/issues/1439)
import SplashScreen from 'react-native-splash-screen'
import {
  NavigationActions,
  NavigationBackActionPayload,
  NavigationContainerComponent,
  NavigationParams,
  NavigationState,
  StackActions,
} from 'react-navigation'
import sleep from 'sleep-promise'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { Screens } from 'src/navigator/Screens'
import { store } from 'src/redux/store'
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

async function ensureNavigator() {
  let retries = 0
  while (!navigator && retries < 3) {
    await sleep(200)
    retries++
  }
  if (!navigator) {
    throw new Error('navigator is not initialized')
  }
}

export function replace(routeName: string, params?: NavigationParams) {
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@replace`, `Dispatch ${routeName}`)
      navigator.dispatch(
        StackActions.replace({
          routeName,
          params,
        })
      )
    })
    .catch((reason) => {
      Logger.error(`${TAG}@replace`, `Navigation failure: ${reason}`)
    })
}

export function navigate(routeName: string, params?: NavigationParams) {
  ensureNavigator()
    .then(() => {
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

async function ensurePincode(): Promise<boolean> {
  const pincodeType = pincodeTypeSelector(store.getState())

  if (pincodeType === PincodeType.Unset) {
    Logger.error(TAG + '@ensurePincode', 'Pin has never been set')
    return false
  }

  if (pincodeType === PincodeType.CustomPin) {
    Logger.debug(TAG + '@ensurePincode', 'Getting custom pin')
    let pin
    try {
      pin = await new Promise((resolve) => {
        navigate(Screens.PincodeEnter, {
          onSuccess: resolve,
          withVerification: true,
        })
      })
    } catch (error) {
      Logger.error(`${TAG}@ensurePincode`, `PIN entering error`, error)
      return false
    }

    if (!pin) {
      Logger.error(`${TAG}@ensurePincode`, `Empty PIN`)
      return false
    }
  }
  return true
}

export function navigateProtected(routeName: string, params?: NavigationParams) {
  ensurePincode()
    .then((ensured) => {
      if (ensured) {
        navigate(routeName, params)
      }
    })
    .catch((error) => {
      Logger.error(`${TAG}@navigateProtected`, 'PIN ensure error', error)
    })
}

// Source: https://v1.reactnavigation.org/docs/screen-tracking.html
function getCurrentRouteName(navState: NavigationState): string {
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

let splashHidden = false

export function handleNavigationStateChange(
  prevState: NavigationState,
  currentState: NavigationState
) {
  const currentScreen = getCurrentRouteName(currentState)
  const previousScreen = getCurrentRouteName(prevState)

  // Hide native splash if necessary, once we navigate away from AppLoading
  if (!splashHidden && currentScreen && currentScreen !== Screens.AppLoading) {
    splashHidden = true
    // Use requestAnimationFrame to prevent a one frame gap when hiding
    requestAnimationFrame(() => {
      SplashScreen.hide()
    })
  }

  CeloAnalytics.page(currentScreen, { previousScreen, currentScreen })
}

export function navigateBack(params?: NavigationBackActionPayload) {
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigateBack`, `Dispatch navigate back`)
      navigator.dispatch(NavigationActions.back(params))
    })
    .catch((reason) => {
      Logger.error(`${TAG}@navigateBack`, `Navigation failure: ${reason}`)
    })
}

export function navigateHome(params?: NavigationParams) {
  navigate(Screens.WalletHome, params)
}

export function navigateToError(errorMessage: string, error?: Error) {
  Logger.error(`${TAG}@navigateToError`, `Navigating to error screen: ${errorMessage}`, error)
  CeloAnalytics.track(DefaultEventNames.errorDisplayed, { error }, true)
  navigate(Screens.ErrorScreen, { errorMessage, error })
}
