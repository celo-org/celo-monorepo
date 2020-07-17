import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow.v2'
import TotalLineItem from 'src/components/TotalLineItem'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'

export interface ExchangeConfirmationCardProps {
  makerAmount: MoneyAmount
  takerAmount: MoneyAmount
}

type Props = ExchangeConfirmationCardProps

export default function ExchangeConfirmationCard(props: Props) {
  const { t } = useTranslation(Namespaces.exchangeFlow9)
  const { makerAmount, takerAmount } = props
  const isSellGoldTx = makerAmount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
  const [gold, dollars] = isSellGoldTx
    ? [makerAmount.value, takerAmount.value]
    : [takerAmount.value, makerAmount.value]

  // TODO: show real fees
  const tobinTax = 0
  const fee = 0

  const localAmount = (isSellGoldTx ? makerAmount : takerAmount).localAmount!
  // TODO: find a way on how to show local exchangeRate without this hack
  const exchangeRateAmount = {
    value: localAmount.exchangeRate,
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    localAmount: {
      value: localAmount.exchangeRate,
      exchangeRate: localAmount.exchangeRate,
      currencyCode: localAmount.currencyCode,
    },
  }

  const goldAmount = {
    value: gold,
    currencyCode: CURRENCIES[CURRENCY_ENUM.GOLD].code,
  }

  const subtotalAmount = {
    value: dollars,
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  const exchangeFeeAmount = {
    value: tobinTax,
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }
  const securityFeeAmount = {
    value: fee,
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  const totalAmount = {
    value: new BigNumber(dollars).plus(tobinTax).plus(fee),
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <View style={styles.paddedContainer}>
          <View style={styles.flexStart}>
            <View style={styles.amountRow}>
              <Text style={styles.exchangeBodyText}>{t('goldAmount')}</Text>
              <CurrencyDisplay style={styles.currencyAmountText} amount={goldAmount} />
            </View>
            <HorizontalLine />
            <LineItemRow
              title={
                <Trans i18nKey="subtotalAmount" ns={Namespaces.exchangeFlow9}>
                  Subtotal @ <CurrencyDisplay amount={exchangeRateAmount} showLocalAmount={true} />
                </Trans>
              }
              amount={<CurrencyDisplay amount={subtotalAmount} />}
            />
            <LineItemRow
              title={t('exchangeFee')}
              titleIcon={<FeeIcon />}
              amount={<CurrencyDisplay amount={exchangeFeeAmount} formatType={FormatType.Fee} />}
            />
            <LineItemRow
              title={t('securityFee')}
              titleIcon={<FeeIcon isExchange={true} />}
              amount={<CurrencyDisplay amount={securityFeeAmount} formatType={FormatType.Fee} />}
            />
            <HorizontalLine />
            <TotalLineItem amount={totalAmount} />
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  paddedContainer: {
    paddingHorizontal: 16,
    flex: 1,
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
  exchangeBodyText: {
    ...fontStyles.regular600,
  },
  currencyAmountText: {
    ...fontStyles.regular600,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  buyBtn: {
    padding: variables.contentPadding,
  },
})
