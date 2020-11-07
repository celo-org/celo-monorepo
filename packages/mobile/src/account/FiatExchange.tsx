import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import { useNavigation } from '@react-navigation/native'
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
import { Screens } from 'src/navigator/Screens'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { navigateToURI } from 'src/utils/linking'

function FiatExchange() {
  function goToAddFunds() {
    navigation.navigate(Screens.FiatExchangeOptions, {
      isAddFunds: true,
    })
  }

  function goToExternalExchanges() {
    navigation.navigate(Screens.ExternalExchanges)
  }

  function goToCashOut() {
    navigation.navigate(Screens.FiatExchangeAmount, { isAddFunds: false })
  }

  const { t } = useTranslation()
  const navigation = useNavigation()
  const dollarBalance = useSelector(stableTokenBalanceSelector)
  const dollarAmount = {
    value: dollarBalance ?? '0',
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  const onOpenOtherFundingOptions = () => {
    navigateToURI(FUNDING_LINK)
  }

  return (
    <SafeAreaView style={styles.container}>
      <DrawerTopBar />
      <View style={styles.container}>
        <Image source={fiatExchange} style={styles.image} resizeMode={'contain'} />
        <View style={styles.balanceSheet}>
          <Text style={styles.currentBalance}>{t('global:currentBalance')}</Text>
          <CurrencyDisplay style={styles.localBalance} amount={dollarAmount} />
          <CurrencyDisplay
            style={styles.dollarBalance}
            amount={dollarAmount}
            showLocalAmount={false}
            hideFullCurrencyName={false}
            hideSymbol={true}
          />
        </View>
      </View>

      <View style={styles.optionsListContainer}>
        <ListItem onPress={goToAddFunds}>
          <Text style={styles.optionTitle}>{t('fiatExchangeFlow:addFunds')}</Text>
        </ListItem>
        <ListItem onPress={goToExternalExchanges}>
          <Text style={styles.optionTitle}>{t('fiatExchangeFlow:buySellOnExchanges')}</Text>
        </ListItem>
        {features.SHOW_CASH_OUT ? (
          <ListItem onPress={goToCashOut}>
            <Text style={styles.optionTitle}>{t('fiatExchangeFlow:cashOut')}</Text>
          </ListItem>
        ) : (
          <ListItem>
            <Text style={styles.optionTitleComingSoon}>
              {t('fiatExchangeFlow:cashOutComingSoon')}
            </Text>
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
  image: {
    alignSelf: 'center',
  },
  balanceSheet: {
    paddingVertical: variables.contentPadding,
    paddingRight: variables.contentPadding,
    marginLeft: variables.contentPadding,
    height: 112,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  currentBalance: {
    ...fontStyles.h2,
    marginBottom: 4,
  },
  localBalance: {
    ...fontStyles.large,
    marginBottom: 2,
  },
  dollarBalance: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  optionsListContainer: {
    flex: 1,
  },
  optionTitle: {
    ...fontStyles.regular,
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
