import AsyncStorage from '@react-native-community/async-storage'
import { NavigationContainer, NavigationState } from '@react-navigation/native'
import * as React from 'react'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DEV_RESTORE_NAV_STATE_ON_RELOAD } from 'src/config'
import { navigationRef } from 'src/navigator/NavigationService'
import Navigator from 'src/navigator/Navigator'
import Logger from 'src/utils/Logger'

// This uses RN Navigation's experimental nav state persistence
// to improve the hot reloading experience when in DEV mode
// https://reactnavigation.org/docs/en/state-persistence.html
const PERSISTENCE_KEY = 'NAVIGATION_STATE'

const getActiveRouteName = (state: NavigationState) => {
  const route = state.routes[state.index]

  if (route.state) {
    // @ts-ignore Dive into nested navigators
    return getActiveRouteName(route.state)
  }

  return route.name
}

export const NavigatorWrapper = () => {
  const [isReady, setIsReady] = React.useState(
    __DEV__ || DEV_RESTORE_NAV_STATE_ON_RELOAD ? false : true
  )
  const [initialState, setInitialState] = React.useState()

  const routeNameRef = React.useRef()

  React.useEffect(() => {
    if (navigationRef && navigationRef.current) {
      const state = navigationRef.current.getRootState()

      // Save the initial route name
      routeNameRef.current = getActiveRouteName(state)
    }
  }, [])

  React.useEffect(() => {
    const restoreState = async () => {
      const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY)
      if (savedStateString) {
        try {
          const state = JSON.parse(savedStateString)

          setInitialState(state)
        } catch (e) {
          Logger.error('NavigatorWrapper', 'Error getting nav state', e)
        }
      }
      setIsReady(true)
    }

    if (!isReady) {
      restoreState().catch((error) =>
        Logger.error('NavigatorWrapper', 'Error persisting nav state', error)
      )
    }
  }, [isReady])

  if (!isReady) {
    return null
  }

  const handleStateChange = (state: NavigationState | undefined) => {
    if (state === undefined) {
      return
    }

    AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state)).catch((error) =>
      Logger.error('NavigatorWrapper', 'Error persisting nav state', error)
    )

    const previousRouteName = routeNameRef.current
    const currentRouteName = getActiveRouteName(state)

    if (previousRouteName !== currentRouteName) {
      // The line below uses the @react-native-firebase/analytics tracker
      // Change this line to use another Mobile analytics SDK
      CeloAnalytics.page(currentRouteName, {
        previousScreen: previousRouteName,
        currentScreen: currentRouteName,
      })
    }

    // Save the current route name for later comparision
    routeNameRef.current = currentRouteName
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={handleStateChange}
      initialState={initialState}
    >
      <Navigator />
    </NavigationContainer>
  )
}

export const navbarStyle: {
  headerMode: 'none'
} = {
  headerMode: 'none',
}

export const headerArea = {
  navigationOptions: {
    headerStyle: {
      elevation: 0,
    },
  },
}

export default NavigatorWrapper
