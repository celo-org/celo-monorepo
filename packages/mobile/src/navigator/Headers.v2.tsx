import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { componentStyles } from '@celo/react-components/styles/styles'
import { StackNavigationOptions } from '@react-navigation/stack'
import * as React from 'react'
import { Trans } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import BackButton from 'src/components/BackButton.v2'
import CancelButton from 'src/components/CancelButton.v2'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton } from 'src/navigator/TopBarButton.v2'
import useSelector from 'src/redux/useSelector'
import DisconnectBanner from 'src/shared/DisconnectBanner'

export const noHeader: StackNavigationOptions = {
  headerShown: false,
}

export const noHeaderGestureDisabled: StackNavigationOptions = {
  headerShown: false,
  gestureEnabled: false,
}

const styles = StyleSheet.create({
  headerTitle: {
    ...fontStyles.navigationHeader,
  },
  headerSubTitle: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export const nuxNavigationOptions: StackNavigationOptions = {
  headerShown: true,
  headerTransparent: true,
  headerLeftContainerStyle: { paddingHorizontal: 10 },
  headerLeft: () => <BackButton />,
  headerRightContainerStyle: { paddingHorizontal: 10 },
  headerRight: () => <View />,
  headerTitle: () => <DisconnectBanner />,
  headerTitleContainerStyle: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerStyle: {
    backgroundColor: colors.light,
  },
}

export const nuxNavigationOptionsNoBackButton: StackNavigationOptions = {
  ...nuxNavigationOptions,
  headerLeft: () => <View />,
}

export const emptyHeader: StackNavigationOptions = {
  headerTitle: ' ',
  headerShown: true,
  headerTitleStyle: [styles.headerTitle, componentStyles.screenHeader],
  headerTitleContainerStyle: {
    alignItems: 'center',
  },
  headerTitleAlign: 'center',
  cardStyle: { backgroundColor: colors.background },
  headerStyle: {
    backgroundColor: colors.light,
    shadowRadius: 0,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    ...Platform.select({
      android: {
        elevation: 0,
        backgroundColor: 'transparent',
      },
      ios: {
        borderBottomWidth: 0,
        borderBottomColor: 'transparent',
      },
    }),
  },
}

export const drawerHeader: StackNavigationOptions = {
  ...emptyHeader,
}

export const headerWithBackButton: StackNavigationOptions = {
  ...emptyHeader,
  headerLeft: () => <BackButton />,
}

export const headerWithCancelButton: StackNavigationOptions = {
  ...emptyHeader,
  headerLeft: () => <CancelButton />,
}

export const headerWithCloseButton: StackNavigationOptions = {
  ...emptyHeader,
  headerLeft: () => <TopBarIconButton icon={<Times />} onPress={navigateBack} />,
  headerLeftContainerStyle: { paddingLeft: 20 },
}

interface Props {
  title: string
  token: CURRENCY_ENUM
}

export function HeaderTitleWithBalance({ title, token }: Props) {
  const dollarBalance = useSelector((state) => state.stableToken.balance)
  const goldBalance = useSelector((state) => state.goldToken.balance)

  const balance = token === CURRENCY_ENUM.GOLD ? goldBalance : dollarBalance

  const subTitle =
    balance != null ? (
      <Trans i18nKey="balanceAvailable" ns={Namespaces.global}>
        <CurrencyDisplay
          amount={{
            value: balance,
            currencyCode: CURRENCIES[token].code,
          }}
        />{' '}
        available
      </Trans>
    ) : (
      // TODO: a null balance doesn't necessarily mean it's loading
      i18n.t('global:loading')
    )

  return <HeaderTitleWithSubtitle title={title} subTitle={subTitle} />
}

export function HeaderTitleWithSubtitle({
  title,
  subTitle,
}: {
  title: string | JSX.Element
  subTitle: string | JSX.Element
}) {
  return (
    <View style={styles.header}>
      {title && <Text style={styles.headerTitle}>{title}</Text>}
      {subTitle && <Text style={styles.headerSubTitle}>{subTitle}</Text>}
    </View>
  )
}

HeaderTitleWithBalance.defaultProps = {
  token: CURRENCY_ENUM.DOLLAR,
}
