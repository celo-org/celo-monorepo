import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useExchangeRate, useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'

export interface OwnProps {
  address?: string
  comment?: string
  value: BigNumber
  currency: CURRENCY_ENUM
  e164PhoneNumber?: string
  recipient?: Recipient
}

interface StateProps {
  dollarBalance: string
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    dollarBalance: state.stableToken.balance || '0',
  }
}

// Bordered content placed in a ReviewFrame for summarizing a payment request
function PaymentRequestReviewCard({
  recipient,
  address,
  e164PhoneNumber,
  t,
  dollarBalance,
  currency,
  value,
  comment,
}: OwnProps & StateProps & WithTranslation) {
  const localCurrencyCode = useLocalCurrencyCode()
  const exchangeRate = useExchangeRate()
  const amount = { value: value.toString(), currencyCode: CURRENCIES[currency].code }
  const totalAmount = {
    value: value.plus(dollarBalance).toString(),
    currencyCode: CURRENCIES[currency].code,
  }
  const isUsdLocalCurrency = localCurrencyCode === LocalCurrencyCode.USD

  return (
    <View style={style.container}>
      <Avatar recipient={recipient} address={address} e164Number={e164PhoneNumber} />
      <CurrencyDisplay
        type={DisplayType.Big}
        style={style.amount}
        amount={amount}
        showExplicitPositiveSign={true}
        hideSymbol={true}
        hideCode={isUsdLocalCurrency}
      />
      <View style={style.bottomContainer}>
        {!!comment && <Text style={[style.pSmall, componentStyles.paddingTop5]}>{comment}</Text>}
        <HorizontalLine />
        <View style={style.feeContainer}>
          {!isUsdLocalCurrency && exchangeRate && (
            <>
              <LineItemRow
                title={t('amountInCeloDollars')}
                amount={
                  <CurrencyDisplay amount={amount} showLocalAmount={false} hideSymbol={true} />
                }
              />
              <Text style={style.localValueHint}>
                <Trans i18nKey="localValueHint" ns={Namespaces.sendFlow7}>
                  @{' '}
                  <CurrencyDisplay
                    amount={{
                      value: new BigNumber(exchangeRate).pow(-1).toString(),
                      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                    }}
                    showLocalAmount={false}
                  />
                </Trans>
              </Text>
            </>
          )}
          <LineItemRow
            title={t('newAccountBalance')}
            amount={
              <CurrencyDisplay amount={totalAmount} showLocalAmount={false} hideSymbol={true} />
            }
          />
        </View>
      </View>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    flexDirection: 'column',
    paddingVertical: 25,
    paddingHorizontal: 40,
  },
  bottomContainer: {
    marginTop: 5,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  feeContainer: {
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  amount: {
    marginTop: 15,
    color: colors.darkSecondary,
  },
  pSmall: {
    fontSize: 14,
    color: colors.darkSecondary,
    ...fontStyles.light,
    lineHeight: 18,
    textAlign: 'center',
  },
  localValueHint: {
    ...fontStyles.light,
    fontSize: 14,
    lineHeight: 20,
    color: colors.lightGray,
    marginBottom: 3,
  },
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withTranslation(Namespaces.sendFlow7)(PaymentRequestReviewCard)
)
