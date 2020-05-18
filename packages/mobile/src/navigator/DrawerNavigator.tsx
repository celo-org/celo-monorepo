import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { createDrawerNavigator } from '@react-navigation/drawer'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import WalletHome from 'src/home/WalletHome'
import { Namespaces } from 'src/i18n'
import GoldTabIcon from 'src/icons/GoldTab'
import { Screens } from 'src/navigator/Screens'
import { isBackupTooLate } from 'src/redux/selectors'

const Drawer = createDrawerNavigator()

export default function DrawerNavigator() {
  const { t } = useTranslation(Namespaces.global)
  const backupTooLate = useSelector(isBackupTooLate)
  const inactiveTintColor = backupTooLate ? colors.inactive : colors.dark

  return (
    <Drawer.Navigator
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
      <Drawer.Screen
        name={Screens.WalletHome}
        component={WalletHome}
        options={{
          tabBarLabel: t('wallet'),
          tabBarIcon: SmartWalletIcon,
        }}
      />
      <Drawer.Screen
        name={Screens.Send}
        component={View}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: SendIcon,
          tabBarButton: SendButton,
        }}
      />
      <Drawer.Screen
        name={Screens.ExchangeHomeScreen}
        component={ExchangeHomeScreen}
        options={{
          tabBarLabel: t('gold'),
          tabBarIcon: ({ color }) => <GoldTabIcon color={color} />,
        }}
      />
    </Drawer.Navigator>
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
