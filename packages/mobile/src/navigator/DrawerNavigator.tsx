import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentOptions,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import Account from 'src/account/Account'
import FiatExchange from 'src/account/FiatExchange'
import Invite from 'src/account/Invite'
import Support from 'src/account/Support'
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
      <Drawer.Screen name={Screens.Support} component={Support} options={{ title: t('help') }} />
    </Drawer.Navigator>
  )
}
