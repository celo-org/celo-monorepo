import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { FUNDING_LINK } from 'src/config'
import { features } from 'src/flags'
import { Namespaces } from 'src/i18n'
import { fiatExchange } from 'src/images/Images'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { navigateToURI } from 'src/utils/linking'

function FiatExchange() {
  function goToAddFunds() {
    navigate(Screens.FiatExchangeOptions, {
      isAddFunds: true,
    })
  }

  function goToCashOut() {
    navigate(Screens.FiatExchangeOptions, { isAddFunds: false })
  }

  function goToSpend() {
    navigate(Screens.Spend)
  }

  const { t } = useTranslation()
  const dollarBalance = useSelector(stableTokenBalanceSelector)
  const dollarAmount = {
    value: dollarBalance ?? '0',
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  const { FIAT_SPEND_ENABLED } = useCountryFeatures()

  const onOpenOtherFundingOptions = () => {
    navigateToURI(FUNDING_LINK)
  }

  return (
    <SafeAreaView style={styles.container}>
      <DrawerTopBar />
      <View style={styles.headerContainer}>
        <View style={styles.balanceSheet}>
          <Text style={styles.currentBalance}>{t('global:currentBalance')}</Text>
          <CurrencyDisplay style={styles.localBalance} amount={dollarAmount} />
        </View>
        <Image source={fiatExchange} style={styles.image} resizeMode={'contain'} />
      </View>

      <View style={styles.optionsListContainer}>
        <ListItem onPress={goToAddFunds}>
          <Text style={styles.optionTitle}>{t('fiatExchangeFlow:addFunds')}</Text>
          <Text style={styles.optionSubtitle}>{t('fiatExchangeFlow:addFundsSubtitle')}</Text>
        </ListItem>
        {features.SHOW_CASH_OUT ? (
          <ListItem onPress={goToCashOut}>
            <Text style={styles.optionTitle}>{t('fiatExchangeFlow:cashOut')}</Text>
            <Text style={styles.optionSubtitle}>{t('fiatExchangeFlow:cashOutSubtitle')}</Text>
          </ListItem>
        ) : (
          <ListItem>
            <Text style={styles.optionTitleComingSoon}>
              {t('fiatExchangeFlow:cashOutComingSoon')}
            </Text>
          </ListItem>
        )}
        {FIAT_SPEND_ENABLED && (
          <ListItem onPress={goToSpend}>
            <Text style={styles.optionTitle}>{t('fiatExchangeFlow:spend')}</Text>
            <Text style={styles.optionSubtitle}>{t('fiatExchangeFlow:spendSubtitle')}</Text>
          </ListItem>
        )}
      </View>
      <Text style={styles.moreWays}>
        <Trans i18nKey="otherFundingOptions" ns={Namespaces.fiatExchangeFlow}>
          <Text onPress={onOpenOtherFundingOptions} style={styles.fundingOptionsLink} />
        </Trans>
      </Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  image: {
    marginRight: variables.contentPadding,
  },
  balanceSheet: {
    paddingVertical: variables.contentPadding,
    paddingRight: variables.contentPadding,
    marginLeft: variables.contentPadding,
  },
  currentBalance: {
    ...fontStyles.label,
    color: colors.gray4,
    marginBottom: 4,
  },
  localBalance: {
    ...fontStyles.large500,
    marginBottom: 2,
  },
  optionsListContainer: {
    flex: 1,
  },
  optionTitle: {
    ...fontStyles.regular500,
  },
  optionSubtitle: {
    marginTop: 2,
    ...fontStyles.small,
    color: colors.gray4,
  },
  optionTitleComingSoon: {
    ...fontStyles.regular,
    color: colors.gray3,
  },
  moreWays: {
    ...fontStyles.regular,
    color: colors.gray5,
    margin: variables.contentPadding,
  },
  fundingOptionsLink: {
    textDecorationLine: 'underline',
  },
})

export default FiatExchange
