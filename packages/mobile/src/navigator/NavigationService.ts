// (https://github.com/react-navigation/react-navigation/issues/1439)

import { NavigationActions, StackActions } from '@react-navigation/compat'
import { NavigationContainerRef } from '@react-navigation/native'
import { createRef } from 'react'
import sleep from 'sleep-promise'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { Screens } from 'src/navigator/Screens'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

const TAG = 'NavigationService'

export const navigationRef = createRef<NavigationContainerRef>()

async function ensureNavigator() {
  let retries = 0
  while (!navigationRef.current && retries < 3) {
    await sleep(200)
    retries++
  }
  if (!navigationRef.current) {
    throw new Error('navigator is not initialized')
  }
}

export function replace(routeName: string, params?: object) {
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@replace`, `Dispatch ${routeName}`)
      navigationRef.current?.dispatch(
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

export function navigate(routeName: string, params?: object) {
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigate`, `Dispatch ${routeName}`)

      navigationRef.current?.dispatch(
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

export function navigateProtected(routeName: string, params?: object) {
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

export function navigateBack(params?: object) {
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigateBack`, `Dispatch navigate back`)
      navigationRef.current?.dispatch(NavigationActions.back(params))
    })
    .catch((reason) => {
      Logger.error(`${TAG}@navigateBack`, `Navigation failure: ${reason}`)
    })
}

export function navigateHome(params?: object) {
  navigate(Screens.WalletHome, params)
}

export function navigateToError(errorMessage: string, error?: Error) {
  Logger.error(`${TAG}@navigateToError`, `Navigating to error screen: ${errorMessage}`, error)
  CeloAnalytics.track(DefaultEventNames.errorDisplayed, { error }, true)
  navigate(Screens.ErrorScreen, { errorMessage, error })
}
