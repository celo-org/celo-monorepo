import BigNumber from 'bignumber.js'
import * as React from 'react'
import { ApolloProvider } from 'react-apollo'
import {
  Dimensions,
  EmitterSubscription,
  Linking,
  NativeEventEmitter,
  Platform,
  StatusBar,
  YellowBox,
} from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableScreens } from 'react-native-screens'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { apolloClient } from 'src/apollo/index'
import { openDeepLink } from 'src/app/actions'
import AppLoading from 'src/app/AppLoading'
import ErrorBoundary from 'src/app/ErrorBoundary'
import i18n from 'src/i18n'
import NavigatorWrapper from 'src/navigator/NavigatorWrapper'
import { persistor, store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

enableScreens()

Logger.debug('App/init', 'Current Language: ' + i18n.language)
YellowBox.ignoreWarnings([
  'componentWillReceiveProps',
  'Remote debugger', // To avoid "Remote debugger in background tab" warning
  'cancelTouches', // rn-screens warning on iOS
  'Setting a timer', // warns about long setTimeouts which are actually saga timeouts
])

const { decimalSeparator, groupingSeparator } = getNumberFormatSettings()

BigNumber.config({
  FORMAT: {
    decimalSeparator,
    groupSeparator: groupingSeparator,
  },
})

interface State {
  reactInitTime?: number
  reactLoadTime?: number
}

// Enables LayoutAnimation on Android. It makes transitions between states smoother.
// https://reactnative.dev/docs/layoutanimation
// Disabling it for now as it seems to cause blank white screens on certain android devices
// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true)
// }

const createEventListener: (
  eventName: string,
  callback: (reactInitTime: string) => void
) => EmitterSubscription | null = (
  eventName: string,
  callback: (reactInitTime: string) => void
): EmitterSubscription | null => {
  if (Platform.OS === 'android') {
    return new NativeEventEmitter().addListener(eventName, callback)
  }
  // TODO: Add listener for iOS
  return null
}

export class App extends React.Component {
  state: State = {
    reactInitTime: undefined,
    reactLoadTime: undefined,
  }

  appStartListener: EmitterSubscription | null = createEventListener(
    'AppStartedLoading',
    (reactInitTime: string) => {
      this.setState({
        reactInitTime: +reactInitTime,
        reactLoadTime: Date.now(),
      })
    }
  )

  async componentDidMount() {
    await ValoraAnalytics.init()
    const { width, height } = Dimensions.get('window')

    let reactLoadDuration
    let appLoadDuration

    if (this.state.reactInitTime && this.state.reactLoadTime) {
      const appLoadedTime = Date.now()
      reactLoadDuration = (this.state.reactLoadTime - this.state.reactInitTime) / 1000
      appLoadDuration = (appLoadedTime - this.state.reactInitTime) / 1000
    }

    ValoraAnalytics.startSession(AppEvents.app_launched, {
      deviceHeight: height,
      deviceWidth: width,
      reactLoadDuration,
      appLoadDuration,
    })

    if (this.appStartListener) {
      this.appStartListener.remove()
    }

    Linking.addEventListener('url', this.handleOpenURL)
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleOpenURL)
  }

  handleOpenURL = (event: any) => {
    store.dispatch(openDeepLink(event.url))
  }

  render() {
    return (
      <SafeAreaProvider>
        <ApolloProvider client={apolloClient}>
          <Provider store={store}>
            <PersistGate loading={<AppLoading />} persistor={persistor}>
              <StatusBar backgroundColor="transparent" barStyle="dark-content" />
              <ErrorBoundary>
                <NavigatorWrapper />
              </ErrorBoundary>
            </PersistGate>
          </Provider>
        </ApolloProvider>
      </SafeAreaProvider>
    )
  }
}

export default App
