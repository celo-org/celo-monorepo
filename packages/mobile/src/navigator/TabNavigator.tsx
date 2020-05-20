import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import { useNavigation } from '@react-navigation/core'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import WalletHome from 'src/home/WalletHome'
import { Namespaces } from 'src/i18n'
import GoldTabIcon from 'src/icons/GoldTab'
import PaymentsIcon from 'src/icons/PaymentsIcon'
import WalletIcon from 'src/icons/Wallet'
import { Screens } from 'src/navigator/Screens'
import { getTabBarActiveNotification, isBackupTooLate } from 'src/redux/selectors'

const TabNav = createBottomTabNavigator()

function SendIcon() {
  const tooLate = useSelector(isBackupTooLate)
  const color = tooLate ? colors.inactive : colors.dark

  return (
    <View style={styles.alignPaymentIcon}>
      <PaymentsIcon color={color} />
    </View>
  )
}

const SmartWalletIcon = ({ color }: { color: string }) => {
  const hasActiveNotifications = useSelector(getTabBarActiveNotification)

  return (
    <View style={styles.alignWallet}>
      {hasActiveNotifications && <View style={styles.circle} />}
      <WalletIcon color={color} />
    </View>
  )
}

function TabBarButtonComponent(props: BottomTabBarButtonProps & { isSend?: boolean }) {
  const backupTooLate = useSelector(isBackupTooLate)
  const navigation = useNavigation()
  let { onPress } = props
  if (props.isSend) {
    onPress = () => {
      navigation.dangerouslyGetParent()?.navigate(Screens.Send)
    }
  }

  return (
    <Touchable
      // @ts-ignore
      {...props}
      // @ts-ignore
      onPress={onPress}
      borderless={true}
      disabled={backupTooLate}
    >
      {props.children}
    </Touchable>
  )
}

const SendButton = (props: BottomTabBarButtonProps) => (
  <TabBarButtonComponent {...props} isSend={true} />
)

export default function TabNavigator() {
  const { t } = useTranslation(Namespaces.global)
  const backupTooLate = useSelector(isBackupTooLate)
  const inactiveTintColor = backupTooLate ? colors.inactive : colors.dark

  return (
    <TabNav.Navigator
      initialRouteName={Screens.WalletHome}
      screenOptions={{
        tabBarButton: TabBarButtonComponent,
      }}
      tabBarOptions={{
        activeTintColor: colors.celoGreen,
        inactiveTintColor,
        labelStyle: styles.label,
        style: styles.tabBar,
      }}
    >
      <TabNav.Screen
        name={Screens.WalletHome}
        component={WalletHome}
        options={{
          tabBarLabel: t('wallet'),
          tabBarIcon: SmartWalletIcon,
        }}
      />
      <TabNav.Screen
        name={Screens.Send}
        component={View}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: SendIcon,
          tabBarButton: SendButton,
        }}
      />
      <TabNav.Screen
        name={Screens.ExchangeHomeScreen}
        component={ExchangeHomeScreen}
        options={{
          tabBarLabel: t('gold'),
          tabBarIcon: ({ color }) => <GoldTabIcon color={color} />,
        }}
      />
    </TabNav.Navigator>
  )
}

const styles = StyleSheet.create({
  label: {
    alignSelf: 'center',
    fontSize: 13,
    ...fontStyles.semiBold,
  },
  tabBar: {
    height: 60,
    paddingBottom: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
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
    marginBottom: 8,
  },
})
