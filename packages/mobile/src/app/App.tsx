import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { ApolloProvider } from 'react-apollo'
import { withNamespaces } from 'react-i18next'
import { DeviceEventEmitter, Linking, StatusBar, YellowBox } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useScreens } from 'react-native-screens'
import SplashScreen from 'react-native-splash-screen'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { apolloClient } from 'src/apollo/index'
import AppLoading from 'src/app/AppLoading'
import ErrorBoundary from 'src/app/ErrorBoundary'
import { handleDeepLink } from 'src/app/saga'
import i18n from 'src/i18n'
import Navigator from 'src/navigator/NavigatorWrapper'
import { persistor, store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

// This is not actually a hook
// tslint:disable-next-line
useScreens()

Logger.debug('App/init', 'Current Language: ' + i18n.language)
YellowBox.ignoreWarnings([
  'componentWillReceiveProps',
  'Remote debugger', // To avoid "Remote debugger in background tab" warning
  'cancelTouches', // rn-screens warning on iOS
  'Setting a timer', // warns about long setTimeouts which are actually saga timeouts
])

const WrappedNavigator = withNamespaces('common', {
  wait: true,
  bindI18n: 'languageChanged',
  bindStore: false,
  // @ts-ignore
})(Navigator)

WrappedNavigator.displayName = 'WrappedNavigator'

export class App extends React.Component {
  async componentDidMount() {
    CeloAnalytics.track(DefaultEventNames.appLoaded, this.props, true)
    const appLoadedAt: Date = new Date()
    const appStartListener = DeviceEventEmitter.addListener(
      'AppStartedLoading',
      (appInitializedAtString: string) => {
        const appInitializedAt = new Date(appInitializedAtString)
        const tti = appLoadedAt.getTime() - appInitializedAt.getTime()
        CeloAnalytics.track(DefaultEventNames.appLoadTTIInMilliseconds, { tti }, true)
        appStartListener.remove()
      }
    )

    Linking.addEventListener('url', this.handleOpenURL)
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleOpenURL)
  }

  handleOpenURL = (event: any) => {
    handleDeepLink(event.url)
  }

  hideSplashScreen() {
    SplashScreen.hide()
  }

  render() {
    return (
      // @ts-ignore Apollo doesn't like the typings
      <ApolloProvider client={apolloClient}>
        <Provider store={store}>
          <SafeAreaProvider>
            <PersistGate
              onBeforeLift={this.hideSplashScreen}
              loading={<AppLoading />}
              persistor={persistor}
            >
              <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
              <ErrorBoundary>
                <WrappedNavigator />
              </ErrorBoundary>
            </PersistGate>
          </SafeAreaProvider>
        </Provider>
      </ApolloProvider>
    )
  }
}

export default App
