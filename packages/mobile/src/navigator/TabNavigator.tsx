import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { createBottomTabNavigator } from 'react-navigation'
import { connect } from 'react-redux'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import WalletHome from 'src/home/WalletHome'
import { Namespaces } from 'src/i18n'
import GoldTabIcon from 'src/icons/GoldTab'
import PaymentsIcon from 'src/icons/PaymentsIcon'
import WalletIcon from 'src/icons/Wallet'
import { navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'
import TabBar from 'src/navigator/TabBar'
import { RootState } from 'src/redux/reducers'
import { getTabBarActiveNotification } from 'src/redux/selectors'
import Send from 'src/send/Send'

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
      <View style={styles.alignWallet}>
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
    [Screens.Send]: {
      screen: Send,
      navigationOptions: {
        tabBarButtonComponent: TabBarButtonComponent,
        tabBarIcon: (props: any) => (
          <View style={styles.alignPaymentIcon}>
            <PaymentsIcon color={props.tintColor} />
          </View>
        ),
        tabBarLabel: () => null,
        tabBarOnPress: () => {
          navigate(Stacks.SendStack)
        },
        tabBarOnLongPress: () => {
          navigate(Stacks.SendStack)
        },
      },
    },
    [Screens.ExchangeHomeScreen]: {
      screen: ExchangeHomeScreen,
      navigationOptions: {
        tabBarButtonComponent: TabBarButtonComponent,
        tabBarIcon: (props: any) => <GoldTabIcon color={props.tintColor} />,
        tabBarLabel: ({ tintColor }: LabelProps) => {
          return <MenuText testID="ExchangeNavigator" transKey="gold" tintColor={tintColor} />
        },
      },
    },
  },
  {
    navigationOptions: { header: null },
    initialRouteName: Screens.WalletHome,
    tabBarComponent: TabBar as any,
    tabBarOptions: {
      activeTintColor: colors.celoGreen,
      inactiveTintColor: colors.dark,
      style: {
        height: 60,
        paddingBottom: 5,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
      },
    },
  }
)

const styles = StyleSheet.create({
  label: {
    alignSelf: 'center',
    fontSize: 13,
    ...fontStyles.semiBold,
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
  alignWallet: {
    marginLeft: 3,
  },
  alignPaymentIcon: {
    marginBottom: 15,
  },
})

export default TabNavigator
