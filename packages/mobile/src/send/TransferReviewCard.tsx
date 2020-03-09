import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { TokenTransactionType } from 'src/apollo/types'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { getInvitationVerificationFeeInDollars } from 'src/invite/saga'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useExchangeRate, useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { Recipient } from 'src/recipients/recipient'

export interface OwnProps {
  address?: string
  comment?: string
  value: BigNumber
  currency: CURRENCY_ENUM
  fee?: BigNumber
  isLoadingFee?: boolean
  feeError?: Error
  type: TokenTransactionType
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
}: OwnProps & WithTranslation) {
  const localCurrencyCode = useLocalCurrencyCode()
  const exchangeRate = useExchangeRate()
  const adjustedFee =
    type === TokenTransactionType.InviteSent && fee
      ? fee.minus(getInvitationVerificationFeeInDollars())
      : fee
  const amount = { value: value.toString(), currencyCode: CURRENCIES[currency].code }
  const amountWithFees = {
    value: value.plus(fee || 0).toString(),
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
          {type === TokenTransactionType.InviteSent && (
            <LineItemRow
              title={t('inviteAndSecurityFee')}
              amount={
                <CurrencyDisplay
                  amount={{
                    value: getInvitationVerificationFeeInDollars().toString(),
                    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                  }}
                  showLocalAmount={false}
                  hideSymbol={true}
                />
              }
            />
          )}
          <LineItemRow
            title={t('securityFee')}
            titleIcon={<FeeIcon />}
            amount={
              adjustedFee && (
                <CurrencyDisplay
                  amount={{
                    value: adjustedFee.toString(),
                    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                  }}
                  formatType={FormatType.Fee}
                  showLocalAmount={false}
                  hideSymbol={true}
                />
              )
            }
            isLoading={isLoadingFee}
            hasError={!!feeError}
          />
          <LineItemRow
            title={t('total')}
            amount={
              <CurrencyDisplay amount={amountWithFees} showLocalAmount={false} hideSymbol={true} />
            }
          />
        </View>
      </View>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 25,
    paddingHorizontal: 20,
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

export default withTranslation(Namespaces.sendFlow7)(TransferReviewCard)
