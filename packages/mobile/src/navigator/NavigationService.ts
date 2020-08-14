// (https://github.com/react-navigation/react-navigation/issues/1439)

import { NavigationActions, StackActions } from '@react-navigation/compat'
import { NavigationContainerRef } from '@react-navigation/native'
import { createRef } from 'react'
import sleep from 'sleep-promise'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { requestPincodeInput } from 'src/pincode/authentication'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

const TAG = 'NavigationService'

type SafeNavigate = typeof navigate

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

export const replace: SafeNavigate = (...args) => {
  const [routeName, params] = args
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

// for when a screen should be pushed onto stack even if it already exists in it.
export const pushToStack: SafeNavigate = (...args) => {
  const [routeName, params] = args
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@pushToStack`, `Dispatch ${routeName}`)
      navigationRef.current?.dispatch(
        StackActions.push({
          routeName,
          params,
        })
      )
    })
    .catch((reason) => {
      Logger.error(`${TAG}@pushToStack`, `Navigation failure: ${reason}`)
    })
}

export function navigate<RouteName extends keyof StackParamList>(
  ...args: undefined extends StackParamList[RouteName]
    ? [RouteName] | [RouteName, StackParamList[RouteName]]
    : [RouteName, StackParamList[RouteName]]
) {
  const [routeName, params] = args
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

export async function ensurePincode(): Promise<boolean> {
  const pincodeType = pincodeTypeSelector(store.getState())

  if (pincodeType === PincodeType.Unset) {
    Logger.error(TAG + '@ensurePincode', 'Pin has never been set')
    ValoraAnalytics.track(OnboardingEvents.pin_never_set)
    return false
  }

  if (pincodeType !== PincodeType.CustomPin) {
    Logger.error(TAG + '@ensurePincode', `Unsupported Pincode Type ${pincodeType}`)
    return false
  }

  try {
    await requestPincodeInput(true, false)
    return true
  } catch (error) {
    Logger.error(`${TAG}@ensurePincode`, `PIN entering error`, error, true)
    return false
  }
}

export function navigateToExchangeHome() {
  if (store.getState().goldToken.educationCompleted) {
    navigate(Screens.ExchangeHomeScreen)
  } else {
    navigate(Screens.GoldEducation)
  }
}

export function navigateBack(params?: object) {
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigateBack`, `Dispatch navigate back`)
      // @ts-ignore
      navigationRef.current?.dispatch(NavigationActions.back(params))
    })
    .catch((reason) => {
      Logger.error(`${TAG}@navigateBack`, `Navigation failure: ${reason}`)
    })
}

interface NavigateHomeOptions {
  onAfterNavigate?: () => void
  params?: StackParamList[Screens.DrawerNavigator]
}

export function navigateHome(options?: NavigateHomeOptions) {
  const { onAfterNavigate, params } = options ?? {}
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name: Screens.DrawerNavigator, params }],
  })

  if (onAfterNavigate) {
    requestAnimationFrame(onAfterNavigate)
  }
}

export function navigateToError(errorMessage: string, error?: Error) {
  Logger.error(`${TAG}@navigateToError`, `Navigating to error screen: ${errorMessage}`, error)
  navigate(Screens.ErrorScreen, { errorMessage })
}
