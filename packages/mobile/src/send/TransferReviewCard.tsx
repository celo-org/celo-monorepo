import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import { MoneyAmount } from '@celo/react-components/components/MoneyAmount'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Avatar from 'src/components/Avatar'
import LineItemRow from 'src/components/LineItemRow'
import { LOCAL_CURRENCY_SYMBOL } from 'src/config'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { getInvitationVerificationFeeInDollars } from 'src/invite/saga'
import { useDollarsToLocalAmount, useExchangeRate } from 'src/localCurrency/hooks'
import { Recipient } from 'src/recipients/recipient'
import FeeIcon from 'src/send/FeeIcon'
import { TransactionTypes } from 'src/transactions/reducer'
import { getFeeDisplayValue, getMoneyDisplayValue } from 'src/utils/formatting'

export interface OwnProps {
  address?: string
  comment?: string
  value: BigNumber
  currency: CURRENCY_ENUM
  fee?: BigNumber
  isLoadingFee?: boolean
  feeError?: Error
  type: TransactionTypes
  e164PhoneNumber?: string
  recipient?: Recipient
}

// Bordered content placed in a ReviewFrame
// Differs from TransferConfirmationCard which is used for viewing completed txs
function TransferReviewCard({
  recipient,
  address,
  e164PhoneNumber,
  currency,
  t,
  type,
  value,
  comment,
  fee,
  isLoadingFee,
  feeError,
}: OwnProps & WithNamespaces) {
  const localValue = useDollarsToLocalAmount(value)
  const exchangeRate = new BigNumber(useExchangeRate() as number)
  const amountWithFees = value.plus(fee || 0)
  const adjustedFee =
    type === TransactionTypes.INVITE_SENT && fee
      ? fee.minus(getInvitationVerificationFeeInDollars())
      : fee

  return (
    <View style={style.container}>
      <Avatar recipient={recipient} address={address} e164Number={e164PhoneNumber} />
      {LOCAL_CURRENCY_SYMBOL && localValue ? (
        <MoneyAmount amount={getMoneyDisplayValue(localValue)} code={LOCAL_CURRENCY_SYMBOL} />
      ) : (
        <MoneyAmount symbol={CURRENCIES[currency].symbol} amount={getMoneyDisplayValue(value)} />
      )}
      <View style={style.bottomContainer}>
        {!!comment && <Text style={[style.pSmall, componentStyles.paddingTop5]}>{comment}</Text>}
        <HorizontalLine />
        <View style={style.feeContainer}>
          {LOCAL_CURRENCY_SYMBOL &&
            localValue && (
              <>
                <LineItemRow
                  currencySymbol={CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol}
                  amount={getMoneyDisplayValue(value)}
                  title={t('amountInCelloDollars')}
                />
                <Text style={style.localValueHint}>
                  {t('localValueHint', {
                    localValue: getMoneyDisplayValue(exchangeRate),
                    localCurrencySymbol: LOCAL_CURRENCY_SYMBOL,
                  })}
                </Text>
              </>
            )}
          {type === TransactionTypes.INVITE_SENT && (
            <LineItemRow
              currencySymbol={CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol}
              amount={getMoneyDisplayValue(getInvitationVerificationFeeInDollars())}
              title={t('inviteAndSecurityFee')}
            />
          )}
          <LineItemRow
            currencySymbol={CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol}
            amount={getFeeDisplayValue(adjustedFee)}
            title={t('securityFee')}
            titleIcon={<FeeIcon />}
            isLoading={isLoadingFee}
            hasError={!!feeError}
          />
          <LineItemRow
            currencySymbol={CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol}
            amount={getMoneyDisplayValue(amountWithFees)}
            title={t('total')}
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
    paddingBottom: 25,
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

export default withNamespaces(Namespaces.sendFlow7)(TransferReviewCard)
