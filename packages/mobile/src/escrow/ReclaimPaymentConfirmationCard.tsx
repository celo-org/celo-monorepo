import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { RecipientWithContact } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'

export interface OwnProps {
  recipientPhone: string
  recipientContact?: RecipientWithContact
  amount: BigNumber
  fee?: BigNumber
  isLoadingFee?: boolean
  feeError?: Error
  currency: CURRENCY_ENUM
}

interface StateProps {
  defaultCountryCode: string
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    defaultCountryCode: state.account.defaultCountryCode,
  }
}

type Props = OwnProps & StateProps & WithTranslation

function ReclaimPaymentConfirmationCard({
  recipientPhone,
  recipientContact,
  amount: passedAmount,
  fee,
  isLoadingFee,
  feeError,
  currency,
  defaultCountryCode,
  t,
}: Props) {
  const amount = { value: passedAmount.toString(), currencyCode: CURRENCIES[currency].code }
  const amountWithFees = {
    value: passedAmount.minus(fee || 0).toString(),
    currencyCode: amount.currencyCode,
  }

  return (
    <View style={styles.container}>
      <Avatar recipient={recipientContact} e164Number={recipientPhone} />
      <CurrencyDisplay type={DisplayType.Big} style={styles.amount} amount={amount} />
      <HorizontalLine />
      <LineItemRow title={t('totalSent')} amount={<CurrencyDisplay amount={amount} />} />
      <LineItemRow
        title={t('securityFee')}
        titleIcon={<FeeIcon />}
        amount={
          fee && (
            <CurrencyDisplay
              amount={{
                value: fee.negated().toString(),
                currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
              }}
              formatType={FormatType.Fee}
            />
          )
        }
        isLoading={isLoadingFee}
        hasError={!!feeError}
      />
      <HorizontalLine />
      <TotalLineItem title={t('totalRefunded')} amount={amountWithFees} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  amount: {
    color: colors.darkSecondary,
  },
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withTranslation(Namespaces.sendFlow7)(ReclaimPaymentConfirmationCard)
)
