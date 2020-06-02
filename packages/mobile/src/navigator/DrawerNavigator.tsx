import ContactCircle from '@celo/react-components/components/ContactCircle'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colorsV2 from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentOptions,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import Account from 'src/account/Account'
import FiatExchange from 'src/account/FiatExchange'
import { default as InviteScreen } from 'src/account/Invite'
import {
  defaultCountryCodeSelector,
  e164NumberSelector,
  nameSelector,
  userContactDetailsSelector,
} from 'src/account/selectors'
import Support from 'src/account/Support'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import WalletHome from 'src/home/WalletHome'
import { Namespaces } from 'src/i18n'
import { AccountKey } from 'src/icons/navigator/AccountKey'
import { AddWithdraw } from 'src/icons/navigator/AddWithdraw'
import { Gold } from 'src/icons/navigator/Gold'
import { Help } from 'src/icons/navigator/Help'
import { Home } from 'src/icons/navigator/Home'
import { Invite } from 'src/icons/navigator/Invite'
import { Settings } from 'src/icons/navigator/Settings'
import { useDollarsToLocalAmount, useLocalCurrencySymbol } from 'src/localCurrency/hooks'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { currentAccountSelector } from 'src/web3/selectors'

const Drawer = createDrawerNavigator()

function CustomDrawerContent(props: DrawerContentComponentProps<DrawerContentOptions>) {
  const displayName = useSelector(nameSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const contactDetails = useSelector(userContactDetailsSelector)
  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const balance = useSelector(stableTokenBalanceSelector)
  const bigNumBalance = balance ? new BigNumber(balance) : undefined
  const localBalance = useDollarsToLocalAmount(balance)
  const symbol = useLocalCurrencySymbol()
  const { t } = useTranslation(Namespaces.global)
  const account = useSelector(currentAccountSelector)
  const appVersion = deviceInfoModule.getVersion()

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerTop}>
        <ContactCircle thumbnailPath={contactDetails.thumbnailPath} name={null} size={64} />
        <Text style={styles.nameLabel}>{displayName}</Text>
        <PhoneNumberWithFlag
          e164PhoneNumber={e164PhoneNumber}
          defaultCountryCode={defaultCountryCode}
        />
        <View style={styles.border} />
        <Text style={fontStyles.regular500}>{`${symbol} ${localBalance?.toFixed(2)}`}</Text>
        <Text style={[styles.smallLabel, styles.dollarsLabel]}>{`${bigNumBalance?.toFixed(2)} ${t(
          'celoDollars'
        )}`}</Text>
        <View style={styles.borderBottom} />
      </View>
      <DrawerItemList {...props} />
      <View style={styles.drawerBottom}>
        <Text style={fontStyles.label}>Account No.</Text>
        <View style={styles.accountOuterContainer}>
          <Text style={styles.smallLabel}>0x</Text>
          <View style={styles.accountInnerContainer}>
            <Text style={styles.smallLabel}>{`${account?.slice(2, 6)} ${account?.slice(
              6,
              10
            )} ${account?.slice(10, 14)} ${account?.slice(14, 18)}`}</Text>
            <Text style={styles.smallLabel}>{`${account?.slice(18, 22)} ${account?.slice(
              22,
              26
            )} ${account?.slice(26, 30)} ${account?.slice(30, 34)}`}</Text>
          </View>
        </View>
        <Text style={styles.smallLabel}>{`Version ${appVersion}`}</Text>
      </View>
    </DrawerContentScrollView>
  )
}

export default function DrawerNavigator() {
  const { t } = useTranslation(Namespaces.global)
  const drawerContent = (props: DrawerContentComponentProps<DrawerContentOptions>) => (
    <CustomDrawerContent {...props} />
  )

  return (
    <Drawer.Navigator
      initialRouteName={Screens.WalletHome}
      drawerContent={drawerContent}
      backBehavior={'initialRoute'}
      drawerContentOptions={{
        labelStyle: [fontStyles.regular, { marginLeft: -20 }],
        activeBackgroundColor: colorsV2.gray2,
      }}
    >
      <Drawer.Screen
        name={Screens.WalletHome}
        component={WalletHome}
        options={{ title: t('home'), drawerIcon: Home }}
      />
      <Drawer.Screen
        name={Screens.ExchangeHomeScreen}
        component={ExchangeHomeScreen}
        options={{ title: t('celoGold'), drawerIcon: Gold }}
      />
      <Drawer.Screen
        name={Screens.BackupIntroduction}
        component={BackupIntroduction}
        options={{ title: t('accountKey'), drawerIcon: AccountKey }}
      />
      <Drawer.Screen
        name={Screens.FiatExchange}
        component={FiatExchange}
        options={{ title: t('addAndWithdraw'), drawerIcon: AddWithdraw }}
      />
      <Drawer.Screen
        name={Screens.Invite}
        component={InviteScreen}
        options={{ title: t('invite'), drawerIcon: Invite }}
      />
      <Drawer.Screen
        name={Screens.Settings}
        component={Account}
        options={{ title: t('settings'), drawerIcon: Settings }}
      />
      <Drawer.Screen
        name={Screens.Support}
        component={Support}
        options={{ title: t('help'), drawerIcon: Help }}
      />
    </Drawer.Navigator>
  )
}

const styles = StyleSheet.create({
  drawerTop: {
    marginLeft: 16,
    marginTop: 16,
    alignItems: 'flex-start',
    marginRight: 16,
  },
  nameLabel: {
    ...fontStyles.large600,
    marginTop: 8,
  },
  border: {
    marginTop: 20,
    marginBottom: 12,
    height: 1,
    backgroundColor: colorsV2.gray2,
    alignSelf: 'stretch',
  },
  dollarsLabel: {
    marginTop: 2,
  },
  borderBottom: {
    height: 1,
    backgroundColor: colorsV2.gray2,
    alignSelf: 'stretch',
    marginTop: 12,
    marginBottom: 12,
  },
  drawerBottom: {
    marginVertical: 32,
    marginHorizontal: 16,
  },
  accountOuterContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 32,
  },
  accountInnerContainer: {
    marginLeft: 4,
    flexDirection: 'column',
  },
  smallLabel: {
    ...fontStyles.small,
    color: colorsV2.gray4,
  },
})
