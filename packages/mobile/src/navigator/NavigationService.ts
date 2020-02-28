// (https://github.com/react-navigation/react-navigation/issues/1439)
import {
  NavigationActions,
  NavigationBackActionPayload,
  NavigationContainerComponent,
  NavigationParams,
  NavigationState,
} from 'react-navigation'
import sleep from 'sleep-promise'
import { PincodeType, pincodeTypeSelector } from 'src/account/reducer'
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

export async function ensurePincode(disableGoingBack: boolean): Promise<boolean> {
  const pincodeType = pincodeTypeSelector(store.getState())

  if (pincodeType === PincodeType.CustomPin) {
    Logger.debug(TAG + '@ensurePincode', 'Getting custom pin')
    let pin
    try {
      pin = await new Promise((resolve) => {
        navigate(Screens.PincodeConfirmation, {
          onSuccess: resolve,
          withVerification: true,
          disableGoingBack,
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

export function navigateProtected(
  routeName: string,
  params?: NavigationParams,
  disableGoingBack = false
) {
  ensurePincode(disableGoingBack)
    .then((ensured) => {
      if (ensured) {
        navigate(routeName, params)
      }
    })
    .catch((error) => {
      Logger.error(`${TAG}@navigateProtected`, 'PIN ensure error', error)
    })
}

export function lockCurrentScreen() {
  ensurePincode(true)
    .then((ensured) => {
      if (ensured) {
        navigateBack()
      }
    })
    .catch((error) => {
      Logger.error(`${TAG}@lockCurrentScreen`, 'PIN ensure error', error)
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

export function navigateBack(params?: NavigationBackActionPayload) {
  Logger.debug(`${TAG}@navigate`, `Dispatch navigate back`)
  navigator.dispatch(NavigationActions.back(params))
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
