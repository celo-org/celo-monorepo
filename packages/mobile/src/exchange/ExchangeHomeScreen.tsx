import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import SectionHead from '@celo/react-components/components/SectionHeadGold'
import { SettingsItemTextValue } from '@celo/react-components/components/SettingsItem'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { fetchExchangeRate } from 'src/exchange/actions'
import CeloExchangeButtons from 'src/exchange/CeloExchangeButtons'
import CeloGoldHistoryChart from 'src/exchange/CeloGoldHistoryChart'
import CeloGoldOverview from 'src/exchange/CeloGoldOverview'
import { useExchangeRate } from 'src/exchange/hooks'
import { exchangeHistorySelector } from 'src/exchange/reducer'
import RestrictedCeloExchange from 'src/exchange/RestrictedCeloExchange'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import TransactionsList from 'src/transactions/TransactionsList'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { goldToDollarAmount } from 'src/utils/currencyExchange'
import { getLocalCurrencyDisplayValue } from 'src/utils/formatting'

type Props = StackScreenProps<StackParamList, Screens.ExchangeHomeScreen>

function navigateToGuide() {
  ValoraAnalytics.track(CeloExchangeEvents.celo_home_info)
  navigate(Screens.GoldEducation)
}

function ExchangeHomeScreen({ navigation }: Props) {
  function dollarsToLocal(amount: BigNumber.Value) {
    return convertDollarsToLocalAmount(amount, localCurrencyCode ? localExchangeRate : 1)
  }

  function displayLocalCurrency(amount: BigNumber.Value) {
    return getLocalCurrencyDisplayValue(amount, localCurrencyCode || LocalCurrencyCode.USD, true)
  }

  function goToWithdrawCelo() {
    ValoraAnalytics.track(CeloExchangeEvents.celo_home_withdraw)
    navigation.navigate(Screens.WithdrawCeloScreen, { isCashOut: false })
  }

  const scrollPosition = useRef(new Animated.Value(0)).current
  const onScroll = Animated.event([
    {
      nativeEvent: {
        contentOffset: {
          y: scrollPosition,
        },
      },
    },
  ])
  const headerOpacity = useMemo(
    () => ({
      opacity: scrollPosition.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: Animated.Extrapolate.CLAMP,
      }),
    }),
    []
  )

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchExchangeRate())
  }, [])

  const { t } = useTranslation(Namespaces.exchangeFlow9)

  const { RESTRICTED_CP_DOTO } = useCountryFeatures()

  // TODO: revert this back to `useLocalCurrencyCode()` when we have history data for cGDL to Local Currency.
  const localCurrencyCode = null
  const localExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const currentExchangeRate = useExchangeRate()

  const perOneGoldInDollars = goldToDollarAmount(1, currentExchangeRate)
  const currentGoldRateInLocalCurrency = perOneGoldInDollars && dollarsToLocal(perOneGoldInDollars)
  let rateChangeInPercentage, rateWentUp
  const exchangeHistory = useSelector(exchangeHistorySelector)
  if (exchangeHistory.aggregatedExchangeRates.length) {
    const oldestGoldRateInLocalCurrency = dollarsToLocal(
      exchangeHistory.aggregatedExchangeRates[0].exchangeRate
    )
    if (oldestGoldRateInLocalCurrency) {
      const rateChange = currentGoldRateInLocalCurrency?.minus(oldestGoldRateInLocalCurrency)
      rateChangeInPercentage = currentGoldRateInLocalCurrency
        ?.div(oldestGoldRateInLocalCurrency)
        .minus(1)
        .multipliedBy(100)
      rateWentUp = rateChange?.gt(0)
    }
  }

  return (
    <SafeAreaView style={styles.background} edges={['top']}>
      <DrawerTopBar
        scrollPosition={scrollPosition}
        middleElement={
          <Animated.View style={[styles.header, headerOpacity]}>
            {currentGoldRateInLocalCurrency && (
              <Text style={styles.goldPriceCurrentValueHeader}>
                {getLocalCurrencyDisplayValue(
                  currentGoldRateInLocalCurrency,
                  LocalCurrencyCode.USD,
                  true
                )}
              </Text>
            )}
            {rateChangeInPercentage && (
              <Text
                style={rateWentUp ? styles.goldPriceWentUpHeader : styles.goldPriceWentDownHeader}
              >
                {rateWentUp ? '▴' : '▾'} {rateChangeInPercentage.toFormat(2)}%
              </Text>
            )}
          </Animated.View>
        }
      />
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={onScroll}
        // style={styles.background}
        testID="ExchangeScrollView"
        stickyHeaderIndices={[]}
        contentContainerStyle={styles.contentContainer}
      >
        <SafeAreaView style={styles.background} edges={['bottom']}>
          <DisconnectBanner />
          <View style={styles.goldPrice}>
            <View style={styles.goldPriceTitleArea}>
              <Text style={styles.goldPriceTitle}>{t('goldPrice')}</Text>
              <Touchable onPress={navigateToGuide} hitSlop={variables.iconHitslop}>
                <InfoIcon size={14} />
              </Touchable>
            </View>
            <View style={styles.goldPriceValues}>
              <Text style={styles.goldPriceCurrentValue}>
                {currentGoldRateInLocalCurrency
                  ? displayLocalCurrency(currentGoldRateInLocalCurrency)
                  : '-'}
              </Text>

              {rateChangeInPercentage && (
                <Text style={rateWentUp ? styles.goldPriceWentUp : styles.goldPriceWentDown}>
                  {rateWentUp ? '▴' : '▾'} {rateChangeInPercentage.toFormat(2)}%
                </Text>
              )}
            </View>
          </View>

          <CeloGoldHistoryChart />
          {RESTRICTED_CP_DOTO ? (
            <RestrictedCeloExchange onPressWithdraw={goToWithdrawCelo} />
          ) : (
            <CeloExchangeButtons navigation={navigation} />
          )}
          <ItemSeparator />
          <CeloGoldOverview testID="ExchangeAccountOverview" />
          <ItemSeparator />
          {!RESTRICTED_CP_DOTO && (
            <SettingsItemTextValue
              title={t('withdrawCelo')}
              onPress={goToWithdrawCelo}
              testID={'WithdrawCELO'}
              showChevron={true}
            />
          )}
          <SectionHead text={t('global:activity')} />
          <TransactionsList currency={CURRENCY_ENUM.GOLD} />
        </SafeAreaView>
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

export default ExchangeHomeScreen

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
  },
  background: {
    flex: 1,
    justifyContent: 'space-between',
  },
  goldPrice: {
    padding: variables.contentPadding,
  },
  goldPriceTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goldPriceTitle: {
    ...fontStyles.h2,
    marginRight: 8,
  },
  goldPriceValues: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  goldPriceCurrentValue: {
    height: 27,
    ...fontStyles.mediumNumber,
  },
  goldPriceCurrentValueHeader: {
    ...fontStyles.regular500,
  },
  goldPriceWentUp: {
    ...fontStyles.regular,
    color: colors.greenUI,
  },
  goldPriceWentDown: {
    ...fontStyles.regular,
    marginLeft: 4,
    color: colors.warning,
  },
  goldPriceWentUpHeader: {
    ...fontStyles.small600,
    color: colors.greenBrand,
  },
  goldPriceWentDownHeader: {
    ...fontStyles.small600,
    color: colors.warning,
  },
})
