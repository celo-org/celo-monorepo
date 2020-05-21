import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentOptions,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { TouchableHighlight } from 'react-native-gesture-handler'
import { Line, Svg } from 'react-native-svg'
import { useSelector } from 'react-redux'
import Account from 'src/account/Account'
import FiatExchange from 'src/account/FiatExchange'
import Invite from 'src/account/Invite'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import { AvatarSelf } from 'src/components/AvatarSelf'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import WalletHome from 'src/home/WalletHome'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { isBackupTooLate } from 'src/redux/selectors'

const Drawer = createDrawerNavigator()

function CustomDrawerContent(props: DrawerContentComponentProps<DrawerContentOptions>) {
  return (
    <DrawerContentScrollView {...props}>
      <AvatarSelf />

      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  )
}

function Hamburger() {
  return (
    <TouchableHighlight>
      <View>
        <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <Line
            x1="7.25"
            y1="9.75"
            x2="24.75"
            y2="9.75"
            stroke="#2E3338"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Line
            x1="7.25"
            y1="15.75"
            x2="24.75"
            y2="15.75"
            stroke="#2E3338"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Line
            x1="7.25"
            y1="21.75"
            x2="24.75"
            y2="21.75"
            stroke="#2E3338"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </TouchableHighlight>
  )
}

export default function DrawerNavigator() {
  const { t } = useTranslation(Namespaces.global)
  const backupTooLate = useSelector(isBackupTooLate)

  return (
    <Drawer.Navigator
      initialRouteName={Screens.WalletHome}
      drawerContent={CustomDrawerContent}
      backBehavior={'initialRoute'}
    >
      <Drawer.Screen
        name={Screens.WalletHome}
        component={WalletHome}
        options={{ title: t('home') }}
      />
      <Drawer.Screen
        name={Screens.ExchangeHomeScreen}
        component={ExchangeHomeScreen}
        options={{ title: t('celoGold') }}
      />
      <Drawer.Screen
        name={Screens.BackupIntroduction}
        component={BackupIntroduction}
        options={{ title: t('accountKey') }}
      />
      <Drawer.Screen
        name={Screens.FiatExchange}
        component={FiatExchange}
        options={{ title: t('addAndWithdraw') }}
      />
      <Drawer.Screen name={Screens.Invite} component={Invite} options={{ title: t('invite') }} />
      <Drawer.Screen
        name={Screens.Settings}
        component={Account}
        options={{ title: t('settings') }}
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
