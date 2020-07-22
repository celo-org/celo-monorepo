import Button, { BtnSizes } from '@celo/react-components/components/Button.v2'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { parseInputAmount } from '@celo/utils/src/parsing'
import { RouteProp } from '@react-navigation/core'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import BackButton from 'src/components/BackButton.v2'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import { DOLLAR_ADD_FUNDS_MIN_AMOUNT, DOLLAR_CASH_OUT_MIN_AMOUNT } from 'src/config'
import { features } from 'src/flags'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import {
  convertDollarsToMaxSupportedPrecision,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { getLocalCurrencyExchangeRate, getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers.v2'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecentPayments } from 'src/send/selectors'
import { isPaymentLimitReached, showLimitReachedError } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

const { decimalSeparator } = getNumberFormatSettings()

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeAmount>

type Props = RouteProps

const oneDollarAmount = {
  value: new BigNumber('1'),
  currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
}

export const fiatExchangesAmountScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatExchangeAmount>
}) => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton />,
    headerTitle: () => (
      <HeaderTitleWithBalance
        title={i18n.t(`fiatExchangeFlow:${route.params?.isAddFunds ? 'addFunds' : 'cashOut'}`)}
        token={CURRENCY_ENUM.DOLLAR}
      />
    ),
  }
}

export function ExchangeTradeScreen({ navigation, route }: Props) {
  function isNextButtonValid() {
    const passMinAmount = dollarAmount.isGreaterThanOrEqualTo(
      isAddFunds ? DOLLAR_ADD_FUNDS_MIN_AMOUNT : DOLLAR_CASH_OUT_MIN_AMOUNT
    )
    const passMaxAmount =
      isAddFunds || (dollarBalance && dollarAmount.isLessThanOrEqualTo(dollarBalance))

    return dollarAmount && passMinAmount && passMaxAmount
  }

  function onChangeExchangeAmount(amount: string) {
    setInputAmount(amount)
  }

  function goNext() {
    const now = Date.now()
    const isLimitReached = isPaymentLimitReached(now, recentPayments, dollarAmount.toNumber())
    if (isLimitReached) {
      dispatch(showLimitReachedError(now, recentPayments, localExchangeRate, localCurrencySymbol))
      return
    }

    navigation.navigate(Screens.FiatExchangeOptions, {
      amount: dollarAmount,
      currencyCode: localCurrencyCode,
      isAddFunds,
    })
  }

  const { isAddFunds } = route.params
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const dispatch = useDispatch()
  const [inputAmount, setInputAmount] = React.useState('')
  const dollarBalance = useSelector(stableTokenBalanceSelector)
  const localExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const localCurrencyCode = useLocalCurrencyCode()
  const recentPayments = useSelector(getRecentPayments)

  const parsedInputAmount = parseInputAmount(inputAmount, decimalSeparator)
  const dollarAmount = convertDollarsToMaxSupportedPrecision(
    (!parsedInputAmount.isNaN() &&
      convertLocalAmountToDollars(parsedInputAmount, localCurrencyCode ? localExchangeRate : 1)) ||
      new BigNumber('0')
  )

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DisconnectBanner />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={'always'}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.amountInputContainer}>
          <View>
            <Text style={styles.exchangeBodyText}>{t('global:amount')}</Text>
          </View>
          <TextInput
            autoFocus={true}
            keyboardType={'decimal-pad'}
            onChangeText={onChangeExchangeAmount}
            value={inputAmount}
            placeholderTextColor={colors.gray3}
            placeholder={'0'}
            style={styles.currencyInput}
            testID="FiatExchangeInput"
          />
        </View>
        <LineItemRow
          textStyle={styles.subtotalBodyText}
          title={
            <Trans i18nKey="celoDollarsAt" ns={Namespaces.fiatExchangeFlow}>
              Celo Dollars @ <CurrencyDisplay amount={oneDollarAmount} />
            </Trans>
          }
          amount={
            <CurrencyDisplay
              amount={{ value: dollarAmount, currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code }}
              hideSymbol={true}
              showLocalAmount={false}
            />
          }
        />
      </KeyboardAwareScrollView>
      {features.CUSD_MOONPAY_ENABLED ? (
        <Text style={styles.disclaimerCeloDollars}>{t('disclaimerCeloDollars')}</Text>
      ) : (
        <Text style={styles.dollarsNotYetEnabledNote}>
          {t('dollarsNotYetEnabledNote') + ' ' + t('disclaimerCeloDollars')}
        </Text>
      )}
      <Button
        onPress={goNext}
        text={t('global:next')}
        accessibilityLabel={t('global:next')}
        disabled={!isNextButtonValid()}
        size={BtnSizes.FULL}
        style={styles.reviewBtn}
        testID="FiatExchangeNextButton"
      />
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

export default ExchangeTradeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  exchangeBodyText: {
    ...fontStyles.regular500,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  subtotalBodyText: {
    ...fontStyles.small,
  },
  currencyInput: {
    ...fontStyles.regular,
    marginLeft: 10,
    flex: 1,
    textAlign: 'right',
    fontSize: 19,
    lineHeight: Platform.select({ android: 27, ios: 23 }), // vertical align = center
    height: 48, // setting height manually b.c. of bug causing text to jump on Android
    color: colors.greenUI,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
  disclaimerCeloDollars: {
    ...fontStyles.small,
    color: colors.gray4,
    textAlign: 'center',
  },
  dollarsNotYetEnabledNote: {
    ...fontStyles.small,
    color: colors.gray4,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
})
