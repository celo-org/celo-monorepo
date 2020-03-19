import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { Trans } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BackButton from 'src/components/BackButton'
import CancelButton from 'src/components/CancelButton'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import useSelector from 'src/redux/useSelector'
import DisconnectBanner from 'src/shared/DisconnectBanner'

export const noHeader = {
  headerLeft: <View />,
}

export const nuxNavigationOptions = {
  headerLeftContainerStyle: { paddingHorizontal: 10 },
  headerLeft: <BackButton />,
  headerRightContainerStyle: { paddingHorizontal: 10 },
  headerRight: <View />,
  headerTitle: <DisconnectBanner />,
  headerTitleContainerStyle: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
}

export const nuxNavigationOptionsNoBackButton = {
  ...nuxNavigationOptions,
  headerLeft: <View />,
}

export const headerWithBackButton = {
  headerTitle: '',
  headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
  headerLeftContainerStyle: { paddingHorizontal: 20 },
  headerLeft: <BackButton />,
  headerRight: <View />, // This helps vertically center the title
}

// TODO(Rossy) align designs to consistently use back button
export const headerWithCancelButton = {
  ...headerWithBackButton,
  headerLeftContainerStyle: { paddingHorizontal: 0 },
  headerLeft: <CancelButton />,
}

interface Props {
  title: string
  token: CURRENCY_ENUM
}

export function HeaderTitleWithBalance({ title, token }: Props) {
  const dollarBalance = useSelector((state) => state.stableToken.balance)
  const goldBalance = useSelector((state) => state.goldToken.balance)

  const balance = token === CURRENCY_ENUM.GOLD ? goldBalance : dollarBalance

  return (
    <View style={styles.header}>
      {title && <Text style={fontStyles.headerTitle}>{title}</Text>}
      <Text style={fontStyles.subSmall}>
        {balance != null ? (
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
        )}
      </Text>
    </View>
  )
}

HeaderTitleWithBalance.defaultProps = {
  token: CURRENCY_ENUM.DOLLAR,
}

export const exchangeHeader = (makerToken: CURRENCY_ENUM) => {
  const title =
    makerToken === CURRENCY_ENUM.DOLLAR
      ? i18n.t('exchangeFlow9:buyGold')
      : i18n.t('exchangeFlow9:sellGold')
  return {
    ...headerWithCancelButton,
    headerTitle: <HeaderTitleWithBalance title={title} token={makerToken} />,
  }
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flex: 1,
  },
})
