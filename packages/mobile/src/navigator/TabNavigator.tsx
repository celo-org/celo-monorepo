import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontFamily } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { createBottomTabNavigator, createStackNavigator } from 'react-navigation'
import { connect } from 'react-redux'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import ExchangeReview from 'src/exchange/ExchangeReview'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import WalletHome from 'src/home/WalletHome'
import { Namespaces } from 'src/i18n'
import ExchangeIcon from 'src/icons/Exchange'
import PaymentsIcon from 'src/icons/PaymentsIcon'
import WalletIcon from 'src/icons/Wallet'
import { commonScreens } from 'src/navigator/Navigator'
import { Screens, Stacks } from 'src/navigator/Screens'
import TabBar from 'src/navigator/TabBar'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import { RootState } from 'src/redux/reducers'
import { getTabBarActiveNotification } from 'src/redux/selectors'
import FeeEducation from 'src/send/FeeEducation'
import RequestConfirmation from 'src/send/RequestConfirmation'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation from 'src/send/SendConfirmation'

// These stacks need to be defined in this file due to a bug
// with react navigation.
const HomeStack = createStackNavigator(
  {
    [Screens.WalletHome]: WalletHome,
    ...commonScreens,
  },
  {
    defaultNavigationOptions: {
      header: null,
    },
    initialRouteName: Screens.WalletHome,
  }
)

const SendStack = createStackNavigator(
  {
    [Screens.Send]: { screen: Send },
    [Screens.QRCode]: { screen: QRCode },
    [Screens.QRScanner]: { screen: QRScanner },
    [Screens.SendAmount]: { screen: SendAmount },
    [Screens.SendConfirmation]: { screen: SendConfirmation },
    [Screens.FeeEducation]: { screen: FeeEducation },
    [Screens.RequestConfirmation]: { screen: RequestConfirmation },
    ...commonScreens,
  },
  {
    defaultNavigationOptions: {
      headerStyle: {
        elevation: 0,
      },
    },
    initialRouteName: Screens.Send,
  }
)

const ExchangeStack = createStackNavigator(
  {
    [Screens.ExchangeHomeScreen]: { screen: ExchangeHomeScreen },
    [Screens.ExchangeTradeScreen]: { screen: ExchangeTradeScreen },
    [Screens.ExchangeReview]: { screen: ExchangeReview },
    ...commonScreens,
  },
  {
    defaultNavigationOptions: {
      headerStyle: {
        elevation: 0,
      },
    },
    initialRouteName: Screens.ExchangeHomeScreen,
  }
)

interface LabelProps {
  tintColor: string
}

function TabBarButtonComponent(props: any) {
  return (
    <Touchable {...props} borderless={true}>
      <View {...props}>{props.children}</View>
    </Touchable>
  )
}

interface StateProps {
  hasActiveNotifications: boolean
}

type Props = StateProps & { tintColor: any }
const mapStateToProps = (state: RootState): StateProps => ({
  hasActiveNotifications: getTabBarActiveNotification(state),
})

class WalletIconWithCircle extends React.Component<Props> {
  render() {
    return (
      <View>
        {this.props.hasActiveNotifications && <View style={styles.circle} />}
        <WalletIcon color={this.props.tintColor} />
      </View>
    )
  }
}

interface LanguageProps {
  language: string | null
}

const mapLanguageStateToProps = (state: RootState): LanguageProps => {
  return {
    language: state.app.language,
  }
}

type MenuTextProps = WithNamespaces & {
  transKey: string
  tintColor: string
  testID: string
} & LanguageProps

const MenuText = connect<LanguageProps, {}, {}, RootState>(mapLanguageStateToProps)(
  withNamespaces(Namespaces.global)(
    ({ transKey, tintColor, testID, t, language }: MenuTextProps) => {
      return (
        <Text style={[styles.label, { color: tintColor }]} testID={testID}>
          {t(transKey)}
        </Text>
      )
    }
  )
)

const SmartWalletIcon = connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  WalletIconWithCircle
)

export const TabNavigator = createBottomTabNavigator(
  {
    [Stacks.HomeStack]: {
      screen: HomeStack,
      navigationOptions: {
        tabBarButtonComponent: TabBarButtonComponent,
        tabBarIcon: (props: any) => <SmartWalletIcon {...props} />,
        tabBarLabel: ({ tintColor }: LabelProps) => {
          return <MenuText testID="WalletNavigator" transKey="wallet" tintColor={tintColor} />
        },
      },
    },
    [Stacks.SendStack]: {
      screen: SendStack,
      navigationOptions: {
        tabBarButtonComponent: TabBarButtonComponent,
        tabBarIcon: (props: any) => <PaymentsIcon color={props.tintColor} />,
        tabBarLabel: ({ tintColor }: LabelProps) => {
          return <MenuText testID="SendNavigator" transKey="payments" tintColor={tintColor} />
        },
        // tabBarOnPress: () => {
        //   navigate(Screens.SendStack)
        // },
      },
    },
    [Stacks.ExchangeStack]: {
      screen: ExchangeStack,
      navigationOptions: {
        tabBarButtonComponent: TabBarButtonComponent,
        tabBarIcon: (props: any) => <ExchangeIcon color={props.tintColor} />,
        tabBarLabel: ({ tintColor }: LabelProps) => {
          return <MenuText testID="ExchangeNavigator" transKey="exchange" tintColor={tintColor} />
        },
        // tabBarOnPress: () => {
        //   navigate(Screens.ExchangeHomeScreen)
        // },
      },
    },
  },
  {
    initialRouteName: Stacks.HomeStack,
    tabBarComponent: TabBar as any,
    tabBarOptions: {
      activeTintColor: colors.celoGreen,
      inactiveTintColor: colors.darkSecondary,
      style: {
        height: 60,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
      },
      tabStyle: {
        margin: 5,
      },
    },
  }
)

const styles = StyleSheet.create({
  label: {
    alignSelf: 'center',
    fontSize: 10,
    fontFamily,
  },
  circle: {
    position: 'absolute',
    zIndex: 99,
    right: -6,
    top: 0,
    borderRadius: 8,
    marginHorizontal: 5,
    height: 6,
    width: 6,
    backgroundColor: colors.messageBlue,
  },
})

export default TabNavigator
