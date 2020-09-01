import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native'
import { useCallback, useRef } from 'react'
import { InteractionManager } from 'react-native'
import { useDispatch } from 'react-redux'
import { cancelCreateOrRestoreAccount } from 'src/account/actions'
import { AnalyticsPropertiesList } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Screens } from 'src/navigator/Screens'

interface Props {
  backAnalyticsEvents: [keyof AnalyticsPropertiesList]
}

// This hook is meant to be used in a navigation screen, during onboarding.
// It changes the navigation state on first focus
// so that navigating back will go to the Welcome screen,
// even if there were intermediary screens in between.
// It also dispatches an action when the screen is removed (hardware back button, swipe, or simply navigate back)
export function useBackToWelcomeScreen({ backAnalyticsEvents }: Props) {
  const didResetStackRef = useRef(false)
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const onFocus = useCallback(() => {
    // Wait for animation to finish before resetting the stack,
    // otherwise it flashes the welcome screen while animating
    const resetStackTask = InteractionManager.runAfterInteractions(() => {
      if (didResetStackRef.current) {
        // Nothing to do, we already reset the stack
        return
      }
      didResetStackRef.current = true

      navigation.dispatch((state) => {
        // Find Welcome screen
        let routes = state.routes
        const index = routes.findIndex((r) => r.name === Screens.Welcome)
        routes =
          index === -1
            ? // Welcome screen was not in the stack, add it before this screen
              [{ key: Screens.Welcome, name: Screens.Welcome }, routes[routes.length - 1]]
            : // Make the Welcome screen the previous screen (discard intermediary screens)
              [...routes.slice(0, index + 1), routes[routes.length - 1]]

        return CommonActions.reset({
          ...state,
          routes,
          index: routes.length - 1,
        })
      })
    })

    // Check if this screen is removed while focused (hardware back button, swipe, or simply navigate back)
    // so we can reset some state
    // See https://reactnavigation.org/docs/preventing-going-back
    const cancelBeforeRemove = navigation.addListener('beforeRemove', (event) => {
      const resetScreenName = (event?.data?.action?.payload as any)?.routes?.[0]?.name
      if (resetScreenName !== Screens.DrawerNavigator) {
        backAnalyticsEvents.forEach((analyticsEvent) => {
          ValoraAnalytics.track(analyticsEvent)
        })
        dispatch(cancelCreateOrRestoreAccount())
      }
    })

    return () => {
      resetStackTask.cancel()
      cancelBeforeRemove()
    }
  }, [backAnalyticsEvents])

  useFocusEffect(onFocus)
}

// Wrapper to use the hook in class components
export default function UseBackToWelcomeScreen(props: Props) {
  useBackToWelcomeScreen(props)

  return null
}
