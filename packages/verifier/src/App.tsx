import { navigate, setTopLevelNavigator } from '@celo/react-components/services/NavigationService'
import * as React from 'react'
import { ApolloProvider } from 'react-apollo'
import { StyleSheet, View, YellowBox } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import { createAppContainer, createStackNavigator, createSwitchNavigator } from 'react-navigation'
import { connect, Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { setLanguage } from 'src/app/actions'
import ErrorBox from 'src/components/ErrorBox'
import HomeScreen from 'src/components/HomeScreen/HomeScreen'
import MessageBanner from 'src/components/MessageBanner'
import EducationScreen from 'src/components/NUX/EducationScreen'
import LanguageScreen from 'src/components/NUX/LanguageScreen'
import SetupAccountScreen from 'src/components/NUX/SetupAccountScreen'
import SettingsScreen from 'src/components/Settings/SettingsScreen'
import VerificationReviewScreen from 'src/components/TransactionReview/VerificationReviewScreen'
import i18n from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { persistor, store } from 'src/redux/store'
import { apolloClient } from 'src/services/Apollo'
import { initializeFirebase } from 'src/services/FirebaseDb'
import ErrorBoundary from 'src/shared/ErrorBoundary'
import ErrorScreen from 'src/shared/ErrorScreen'

YellowBox.ignoreWarnings([
  'Warning: isMounted(...) is deprecated',
  'Remote debugger', // To avoid "Remote debugger in background tab" warning
])

const commonScreens = {
  [Screens.Error]: ErrorScreen,
}

const SignUpStack = createStackNavigator(
  {
    [Screens.Language]: { screen: LanguageScreen },
    [Screens.Education]: { screen: EducationScreen },
    [Screens.SetupAccount]: { screen: SetupAccountScreen },
    ...commonScreens,
  },
  {
    initialRouteName: Screens.Language,
    headerMode: 'none',
  }
)

const AppStack = createStackNavigator(
  {
    [Screens.Home]: { screen: HomeScreen },
    [Screens.Settings]: { screen: SettingsScreen },
    [Screens.VerificationReview]: { screen: VerificationReviewScreen },
    ...commonScreens,
  },
  {
    initialRouteName: Screens.Home,
    headerMode: 'none',
  }
)

const AppNavigator = createAppContainer(
  createSwitchNavigator(
    {
      [Screens.SignUp]: SignUpStack,
      [Screens.App]: AppStack,
    },
    {
      initialRouteName: Screens.SignUp,
    }
  )
)

interface NavigatorStateProps {
  language: string | null
  name: string | null
  e164Number: string | null
  educationCompleted: boolean
}

interface DispatchProps {
  setLanguage: typeof setLanguage
}

type Props = DispatchProps & NavigatorStateProps

const mapStateToProps = (state: RootState): NavigatorStateProps => {
  return {
    language: state.app.language,
    name: state.app.name,
    e164Number: state.app.e164Number,
    educationCompleted: state.app.educationCompleted,
  }
}

class Navigator extends React.Component<Props> {
  async componentDidMount() {
    if (this.props.language) {
      i18n.changeLanguage(this.props.language)
      this.props.setLanguage(this.props.language)
    }

    if (!this.props.language) {
      navigate(Screens.Language)
    } else if (!this.props.educationCompleted) {
      navigate(Screens.Education)
    } else if (!this.props.name || !this.props.e164Number) {
      navigate(Screens.SetupAccount)
    } else {
      navigate(Screens.App)
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <ErrorBox />
        <MessageBanner />
        <AppNavigator ref={(r: any) => setTopLevelNavigator(r)} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

const WrappedNavigator = connect<NavigatorStateProps, DispatchProps>(
  mapStateToProps,
  { setLanguage }
)(Navigator)

class App extends React.Component<{}, {}> {
  componentDidMount() {
    initializeFirebase().catch((err) => {
      console.error('Failed to initialize firebase', err)
    })
  }

  hideSplashScreen() {
    SplashScreen.hide()
  }

  render() {
    return (
      // @ts-ignore Apollo doesn't like the typings
      <ApolloProvider client={apolloClient}>
        <Provider store={store}>
          <PersistGate loading={null} onBeforeLift={this.hideSplashScreen} persistor={persistor}>
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
