import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { ApolloProvider } from 'react-apollo'
import { withNamespaces } from 'react-i18next'
import { DeviceEventEmitter, StatusBar, YellowBox } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { apolloClient } from 'src/apollo/index'
import AppLoading from 'src/app/AppLoading'
import ErrorBoundary from 'src/app/ErrorBoundary'
import i18n from 'src/i18n'
import Navigator from 'src/navigator/NavigatorWrapper'
import { persistor, store } from 'src/redux/store'
import Logger from 'src/utils/Logger'

// This is currently breaking paste - looking into it
// import { useScreens } from 'react-native-screens'
// useScreens()

Logger.debug('App/init', 'Current Language: ' + i18n.language)
YellowBox.ignoreWarnings([
  'Warning: isMounted(...) is deprecated',
  'Setting a timer',
  'Remote debugger', // To avoid "Remote debugger in background tab" warning
])

// TODO(cmcewen) Figure out why this is crashing and fix
// configureBackgroundSync(store)

const WrappedNavigator = withNamespaces('common', {
  wait: true,
  bindI18n: 'languageChanged',
  bindStore: false,
  // @ts-ignore
})(Navigator)

WrappedNavigator.displayName = 'WrappedNavigator'

export class App extends React.Component {
  componentDidMount() {
    CeloAnalytics.track(DefaultEventNames.appLoaded, this.props, true)
    const appLoadedAt: Date = new Date()
    // TODO(cmcewen) see above
    // scheduleBackgroundSync()
    const appStartListener = DeviceEventEmitter.addListener(
      'AppStartedLoading',
      (appInitializedAtString: string) => {
        const appInitializedAt = new Date(appInitializedAtString)
        const tti = appLoadedAt.getTime() - appInitializedAt.getTime()
        CeloAnalytics.track(DefaultEventNames.appLoadTTIInMilliseconds, { tti }, true)
        appStartListener.remove()
      }
    )
  }

  hideSplashScreen() {
    SplashScreen.hide()
  }

  render() {
    return (
      // @ts-ignore Apollo doesn't like the typings
      <ApolloProvider client={apolloClient}>
        <Provider store={store}>
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
        </Provider>
      </ApolloProvider>
    )
  }
}

export default App
