import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontFamily } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { createBottomTabNavigator } from 'react-navigation'
import { connect } from 'react-redux'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import WalletHome from 'src/home/WalletHome'
import { Namespaces } from 'src/i18n'
import ExchangeIcon from 'src/icons/Exchange'
import PaymentsIcon from 'src/icons/PaymentsIcon'
import WalletIcon from 'src/icons/Wallet'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getTabBarActiveNotification } from 'src/redux/selectors'
import TabBar from 'src/tab/TabBar'

const SendStack = () => <View />

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
    [Screens.WalletHome]: {
      screen: WalletHome,
      navigationOptions: {
        tabBarButtonComponent: TabBarButtonComponent,
        tabBarIcon: (props: any) => <SmartWalletIcon {...props} />,
        tabBarLabel: ({ tintColor }: LabelProps) => {
          return <MenuText testID="WalletNavigator" transKey="wallet" tintColor={tintColor} />
        },
      },
    },
    Send: {
      screen: SendStack,
      navigationOptions: {
        tabBarButtonComponent: TabBarButtonComponent,
        tabBarIcon: (props: any) => <PaymentsIcon color={props.tintColor} />,
        tabBarLabel: ({ tintColor }: LabelProps) => {
          return <MenuText testID="SendNavigator" transKey="payments" tintColor={tintColor} />
        },
        tabBarOnPress: () => {
          navigate(Screens.SendStack)
        },
      },
    },
    [Screens.ExchangeHomeScreen]: {
      screen: ExchangeHomeScreen,
      navigationOptions: {
        tabBarButtonComponent: TabBarButtonComponent,
        tabBarIcon: (props: any) => <ExchangeIcon color={props.tintColor} />,
        tabBarLabel: ({ tintColor }: LabelProps) => {
          return <MenuText testID="ExchangeNavigator" transKey="exchange" tintColor={tintColor} />
        },
        tabBarOnPress: () => {
          navigate(Screens.ExchangeHomeScreen)
        },
      },
    },
  },
  {
    initialRouteName: Screens.WalletHome,
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
