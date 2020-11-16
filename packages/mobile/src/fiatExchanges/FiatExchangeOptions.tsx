import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { CURRENCY_ENUM } from '@celo/utils'
import { RouteProp } from '@react-navigation/core'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'
import { kotaniEnabledSelector, pontoEnabledSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import { KOTANI_URI, PONTO_URI, SIMPLEX_URI } from 'src/config'
import FundingEducationDialog from 'src/fiatExchanges/FundingEducationDialog'
import i18n, { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'
import RadioIcon from 'src/icons/RadioIcon'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const FALLBACK_CURRENCY = LocalCurrencyCode.USD

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeOptions>
type Props = RouteProps

enum PaymentMethod {
  FIAT = 'FIAT',
  EXCHANGE = 'EXCHANGE',
  ADDRESS = 'ADDRESS',
  PONTO = 'PONTO',
  KOTANI = 'KOTANI',
}

export const fiatExchangesOptionsScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatExchangeOptions>
}) => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton />,
    headerTitle: i18n.t(`fiatExchangeFlow:${route.params?.isAddFunds ? 'addFunds' : 'cashOut'}`),
    headerRightContainerStyle: { paddingRight: 16 },
  }
}

const currencyBorderColor = (selected: boolean) => (selected ? colors.greenUI : colors.gray3)

function CurrencyRadioItem({
  selected,
  onSelect,
  enabled = true,
  title,
  body,
  containerStyle,
}: {
  selected: boolean
  onSelect: () => void
  enabled?: boolean
  title: string
  body?: string
  containerStyle: ViewStyle
}) {
  return (
    <TouchableWithoutFeedback onPress={onSelect} disabled={!enabled}>
      <View
        style={[
          styles.currencyItemContainer,
          containerStyle,
          { borderColor: currencyBorderColor(selected) },
        ]}
      >
        <RadioIcon selected={selected} />
        <Text style={[styles.currencyItemTitle, enabled ? {} : { color: colors.gray3 }]}>
          {title}
        </Text>
        {body && <Text style={styles.currencyItemBody}>{body}</Text>}
      </View>
    </TouchableWithoutFeedback>
  )
}

function PaymentMethodRadioItem({
  selected,
  onSelect,
  text,
  enabled = true,
}: {
  selected: boolean
  onSelect: () => void
  text: string
  enabled?: boolean
}) {
  return (
    <TouchableWithoutFeedback onPress={onSelect} disabled={!enabled}>
      <View style={styles.paymentMethodItemContainer}>
        <RadioIcon selected={selected} />
        <Text style={[styles.paymentMethodItemText, enabled ? {} : { color: colors.gray3 }]}>
          {text}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  )
}

function FiatExchangeOptions({ route, navigation }: Props) {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const isAddFunds = route.params?.isAddFunds ?? true
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const {
    SIMPLEX_DISABLED,
    MOONPAY_DISABLED,
    KOTANI_SUPPORTED,
    PONTO_SUPPORTED,
  } = useCountryFeatures()
  const pontoEnabled = useSelector(pontoEnabledSelector)
  const kotaniEnabled = useSelector(kotaniEnabledSelector)
  const showPonto = pontoEnabled && PONTO_SUPPORTED
  const showKotani = kotaniEnabled && KOTANI_SUPPORTED

  Logger.debug(`Ponto: ${pontoEnabled} Kotani: ${kotaniEnabled}`)

  const [selectedCurrency, setSelectedCurrency] = useState<CURRENCY_ENUM>(CURRENCY_ENUM.DOLLAR)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(
    isAddFunds && !SIMPLEX_DISABLED && !MOONPAY_DISABLED
      ? PaymentMethod.FIAT
      : PaymentMethod.EXCHANGE
  )
  const [isEducationDialogVisible, setEducationDialogVisible] = useState(false)

  const goToProvider = () => {
    if (selectedPaymentMethod === PaymentMethod.EXCHANGE) {
      navigate(Screens.ExternalExchanges, {
        currency: selectedCurrency,
      })
    } else if (selectedPaymentMethod === PaymentMethod.PONTO) {
      navigate(Screens.LocalProviderCashOut, { uri: PONTO_URI })
    } else if (selectedPaymentMethod === PaymentMethod.KOTANI) {
      navigate(Screens.LocalProviderCashOut, { uri: KOTANI_URI })
    } else if (selectedPaymentMethod === PaymentMethod.ADDRESS) {
      navigate(Screens.WithdrawCeloScreen, { isCashOut: true })
    } else if (selectedCurrency === CURRENCY_ENUM.DOLLAR) {
      navigateToURI(`${SIMPLEX_URI}?address=${account}`)
    } else {
      navigate(Screens.MoonPay, {
        localAmount: new BigNumber(0),
        currencyCode: localCurrency || FALLBACK_CURRENCY,
      })
    }
  }

  const onSelectCurrency = (currency: CURRENCY_ENUM) => () => setSelectedCurrency(currency)
  const onSelectPaymentMethod = (paymentMethod: PaymentMethod) => () =>
    setSelectedPaymentMethod(paymentMethod)
  const onPressInfoIcon = () => setEducationDialogVisible(true)
  const onPressDismissEducationDialog = () => setEducationDialogVisible(false)

  return (
    <SafeAreaView style={styles.content}>
      <ScrollView style={styles.topContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.selectDigitalCurrency}>{t('selectDigitalCurrency')}</Text>
          <Touchable onPress={onPressInfoIcon} hitSlop={variables.iconHitslop}>
            <InfoIcon size={14} color={colors.gray3} />
          </Touchable>
        </View>
        <View style={styles.currenciesContainer}>
          <CurrencyRadioItem
            title={t('celoDollar')}
            body="(cUSD)"
            selected={selectedCurrency === CURRENCY_ENUM.DOLLAR}
            onSelect={onSelectCurrency(CURRENCY_ENUM.DOLLAR)}
            containerStyle={{
              borderBottomWidth: 0,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
            enabled={
              (!SIMPLEX_DISABLED || selectedPaymentMethod !== PaymentMethod.FIAT) &&
              selectedPaymentMethod !== PaymentMethod.ADDRESS
            }
          />
          <View style={styles.currencySeparator} />
          <CurrencyRadioItem
            title="CELO"
            selected={selectedCurrency === CURRENCY_ENUM.GOLD}
            onSelect={onSelectCurrency(CURRENCY_ENUM.GOLD)}
            containerStyle={{
              borderTopWidth: 0,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
            enabled={!MOONPAY_DISABLED || selectedPaymentMethod !== PaymentMethod.FIAT}
          />
        </View>
      </ScrollView>
      <View style={styles.bottomContainer}>
        <Text style={styles.selectPaymentMethod}>
          {t(isAddFunds ? 'selectPaymentMethod' : 'selectCashOutMethod')}
        </Text>
        <View style={styles.paymentMethodsContainer}>
          {isAddFunds && (
            <PaymentMethodRadioItem
              text={t('payWithFiat')}
              selected={selectedPaymentMethod === PaymentMethod.FIAT}
              onSelect={onSelectPaymentMethod(PaymentMethod.FIAT)}
              enabled={
                (!MOONPAY_DISABLED || selectedCurrency === CURRENCY_ENUM.DOLLAR) &&
                (!SIMPLEX_DISABLED || selectedCurrency === CURRENCY_ENUM.GOLD)
              }
            />
          )}
          <PaymentMethodRadioItem
            text={t('payWithExchange')}
            selected={selectedPaymentMethod === PaymentMethod.EXCHANGE}
            onSelect={onSelectPaymentMethod(PaymentMethod.EXCHANGE)}
          />
          {!isAddFunds && (
            <>
              <PaymentMethodRadioItem
                text={t('receiveOnAddress')}
                selected={selectedPaymentMethod === PaymentMethod.ADDRESS}
                onSelect={onSelectPaymentMethod(PaymentMethod.ADDRESS)}
                enabled={selectedCurrency === CURRENCY_ENUM.GOLD}
              />
              {showPonto && (
                <PaymentMethodRadioItem
                  text={t('receiveWithPonto')}
                  selected={selectedPaymentMethod === PaymentMethod.PONTO}
                  onSelect={onSelectPaymentMethod(PaymentMethod.PONTO)}
                  enabled={true}
                />
              )}
              {showKotani && (
                <PaymentMethodRadioItem
                  text={t('receiveWithKotani')}
                  selected={selectedPaymentMethod === PaymentMethod.KOTANI}
                  onSelect={onSelectPaymentMethod(PaymentMethod.KOTANI)}
                  enabled={true}
                />
              )}
            </>
          )}
        </View>
        <Button
          style={styles.goToProvider}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          text={t('global:next')}
          onPress={goToProvider}
          testID={'GoToProviderButton'}
        />
      </View>
      <FundingEducationDialog
        isVisible={isEducationDialogVisible}
        onPressDismiss={onPressDismissEducationDialog}
        isCashIn={isAddFunds}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: colors.gray1,
  },
  topContainer: {
    paddingHorizontal: variables.contentPadding,
    backgroundColor: colors.light,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: variables.contentPadding,
  },
  selectDigitalCurrency: {
    ...fontStyles.regular,
    marginRight: 12,
  },
  currenciesContainer: {
    flexDirection: 'column',
    marginTop: 8,
  },
  currencyItemContainer: {
    flexDirection: 'row',
    padding: variables.contentPadding,
    borderWidth: 1,
  },
  currencyItemTitle: {
    ...fontStyles.regular500,
    marginLeft: variables.contentPadding,
  },
  currencyItemBody: {
    ...fontStyles.regular500,
    color: colors.gray4,
    marginLeft: 4,
  },
  currencySeparator: {
    height: 1,
    backgroundColor: colors.greenUI,
  },
  bottomContainer: {
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
  },
  selectPaymentMethod: {
    ...fontStyles.small500,
    marginTop: variables.contentPadding,
  },
  paymentMethodsContainer: {
    flexDirection: 'column',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 8,
  },
  paymentMethodItemContainer: {
    flexDirection: 'row',
    padding: 8,
  },
  paymentMethodItemText: {
    ...fontStyles.small,
    marginLeft: 8,
  },
  goToProvider: {
    width: '50%',
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
})

export default FiatExchangeOptions
