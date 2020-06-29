import ContactCircle from '@celo/react-components/components/ContactCircle'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colorsV2 from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentOptions,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer'
import {
  DrawerDescriptorMap,
  DrawerNavigationHelpers,
} from '@react-navigation/drawer/lib/typescript/src/types'
import {
  CommonActions,
  DrawerActions,
  DrawerNavigationState,
  useLinkBuilder,
} from '@react-navigation/native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import FiatExchange from 'src/account/FiatExchange'
import GoldEducation from 'src/account/GoldEducation'
import {
  defaultCountryCodeSelector,
  e164NumberSelector,
  nameSelector,
  userContactDetailsSelector,
} from 'src/account/selectors'
import SettingsScreen from 'src/account/Settings'
import Support from 'src/account/Support'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import AccountNumber from 'src/components/AccountNumber'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import WalletHome from 'src/home/WalletHome'
import { Namespaces } from 'src/i18n'
import { AccountKey } from 'src/icons/navigator/AccountKey'
import { AddWithdraw } from 'src/icons/navigator/AddWithdraw'
import { Gold } from 'src/icons/navigator/Gold'
import { Help } from 'src/icons/navigator/Help'
import { Home } from 'src/icons/navigator/Home'
import { Settings } from 'src/icons/navigator/Settings'
import { useDollarsToLocalAmount, useLocalCurrencySymbol } from 'src/localCurrency/hooks'
import { ensurePincode } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'NavigationService'

const Drawer = createDrawerNavigator()

type CustomDrawerItemListProps = Omit<DrawerContentOptions, 'contentContainerStyle' | 'style'> & {
  state: DrawerNavigationState
  navigation: DrawerNavigationHelpers
  descriptors: DrawerDescriptorMap
  protectedRoutes: string[]
}

// This component has been taken from here:
// https://github.com/react-navigation/react-navigation/blob/1aadc79fb89177a2fff2dcd791d67a3c880009d0/packages/drawer/src/views/DrawerItemList.tsx
function CustomDrawerItemList({
  state,
  navigation,
  descriptors,
  itemStyle,
  protectedRoutes,
  ...passThroughProps
}: CustomDrawerItemListProps) {
  const buildLink = useLinkBuilder()

  return (state.routes.map((route, i) => {
    const focused = i === state.index
    const { title, drawerLabel, drawerIcon } = descriptors[route.key].options
    const navigateToItem = () => {
      navigation.dispatch({
        ...(focused ? DrawerActions.closeDrawer() : CommonActions.navigate(route.name)),
        target: state.key,
      })
    }
    const onPress = () => {
      if (protectedRoutes.includes(route.name)) {
        // Route should be protected by PIN code
        ensurePincode()
          .then(navigateToItem)
          .catch((error) => {
            Logger.error(`${TAG}@onPress`, 'PIN ensure error', error)
          })
      } else {
        navigateToItem()
      }
    }

    return (
      <DrawerItem
        {...passThroughProps}
        key={route.key}
        label={drawerLabel !== undefined ? drawerLabel : title !== undefined ? title : route.name}
        icon={drawerIcon}
        focused={focused}
        style={itemStyle}
        to={buildLink(route.name, route.params)}
        onPress={onPress}
      />
    )
  }) as React.ReactNode) as React.ReactElement
}

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
        {e164PhoneNumber && (
          <PhoneNumberWithFlag
            e164PhoneNumber={e164PhoneNumber}
            defaultCountryCode={defaultCountryCode ? defaultCountryCode : undefined}
          />
        )}
        <View style={styles.border} />
        <Text style={fontStyles.regular500}>{`${symbol} ${localBalance?.toFixed(2)}`}</Text>
        <Text style={[styles.smallLabel, styles.dollarsLabel]}>{`${bigNumBalance?.toFixed(2)} ${t(
          'celoDollars'
        )}`}</Text>
        <View style={styles.borderBottom} />
      </View>
      <CustomDrawerItemList {...props} protectedRoutes={[Screens.BackupIntroduction]} />
      <View style={styles.drawerBottom}>
        <Text style={fontStyles.label}>Account No.</Text>
        <View style={styles.accountOuterContainer}>
          <View style={styles.accountInnerContainer}>
            <AccountNumber address={account || ''} />
          </View>
        </View>
        <Text style={styles.smallLabel}>{`Version ${appVersion}`}</Text>
      </View>
    </DrawerContentScrollView>
  )
}

export default function DrawerNavigator() {
  const { t } = useTranslation(Namespaces.global)
  const isCeloEducationComplete = useSelector((state) => state.goldToken.educationCompleted)

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
        name={isCeloEducationComplete ? Screens.ExchangeHomeScreen : Screens.GoldEducation}
        component={isCeloEducationComplete ? ExchangeHomeScreen : GoldEducation}
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
        name={Screens.Settings}
        component={SettingsScreen}
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
    ...fontStyles.displayName,
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
