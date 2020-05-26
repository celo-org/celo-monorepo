import QRCodeBorderlessIcon from '@celo/react-components/icons/QRCodeBorderless'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { componentStyles } from '@celo/react-components/styles/styles'
import { RouteProp } from '@react-navigation/core'
import { StackNavigationOptions } from '@react-navigation/stack'
import * as React from 'react'
import { Trans } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import BackButton from 'src/components/BackButton.v2'
import CancelButton from 'src/components/CancelButton.v2'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton, TopBarTextButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import DisconnectBanner from 'src/shared/DisconnectBanner'

export const noHeader: StackNavigationOptions = {
  headerShown: false,
}

const styles = StyleSheet.create({
  headerTitle: {
    ...fontStyles.regular500,
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
    alignItems: 'center' as 'center',
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
      },
      ios: {
        borderBottomWidth: 0,
        borderBottomColor: 'transparent',
      },
    }),
  },
}

export const exchangeTradeOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ExchangeTradeScreen>
}) => {
  const { makerToken } = route.params?.makerTokenDisplay
  const title =
    makerToken === CURRENCY_ENUM.DOLLAR
      ? i18n.t('exchangeFlow9:buyGold')
      : i18n.t('exchangeFlow9:sellGold')
  return {
    ...headerWithCancelButton,
    headerLeft: () => <CancelButton style={{ color: colors.dark }} />,
    headerTitle: () => <HeaderTitleWithBalance title={title} token={makerToken} />,
  }
}

export const exchangeReviewOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ExchangeReview>
}) => {
  const { makerToken } = route.params?.exchangeInput
  const goExchangeHome = () => navigate(Screens.ExchangeHomeScreen)
  const title =
    makerToken === CURRENCY_ENUM.DOLLAR
      ? i18n.t('exchangeFlow9:buyGold')
      : i18n.t('exchangeFlow9:sellGold')
  return {
    ...headerWithCancelButton,
    headerLeft: () => <CancelButton style={{ color: colors.dark }} onCancel={goExchangeHome} />,
    headerRight: () => (
      <TopBarTextButton
        title={i18n.t('global:edit')}
        testID="EditButton"
        onPress={navigateBack}
        titleStyle={{ color: colors.goldDark }}
      />
    ),
    headerTitle: () => <HeaderTitleWithBalance title={title} token={makerToken} />,
  }
}

export const sendOptions = ({ route }: { route: RouteProp<StackParamList, Screens.Send> }) => {
  const goQr = () => navigate(Screens.QRCode)
  return {
    ...emptyHeader,
    headerLeft: () => <TopBarIconButton icon={<Times />} onPress={navigateBack} />,
    headerLeftContainerStyle: { paddingLeft: 20 },
    headerRight: () => (
      <TopBarIconButton
        icon={<QRCodeBorderlessIcon height={32} color={colors.greenUI} />}
        onPress={goQr}
      />
    ),
    headerRightContainerStyle: { paddingRight: 16 },
    headerTitle: i18n.t(`sendFlow7:${route.params?.isRequest ? 'request' : 'send'}`),
  }
}

export const sendAmountOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.SendAmount>
}) => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton />,
    headerTitle: () => (
      <HeaderTitleWithBalance
        title={i18n.t(`sendFlow7:${route.params?.isRequest ? 'request' : 'send'}`)}
        token={CURRENCY_ENUM.DOLLAR}
      />
    ),
  }
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
