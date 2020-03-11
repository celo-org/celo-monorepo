import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import TotalLineItem from 'src/components/TotalLineItem'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
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

// Content placed in a ReviewFrame for summarizing a payment request
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
  const amount = { value: value.toString(), currencyCode: CURRENCIES[currency].code }
  const totalAmount = amount // TODO: add fee?

  return (
    <View style={styles.container}>
      <Avatar recipient={recipient} address={address} e164Number={e164PhoneNumber} />
      <CurrencyDisplay type={DisplayType.Big} style={styles.amount} amount={amount} />
      {!!comment && <Text style={[styles.pSmall, componentStyles.paddingTop5]}>{comment}</Text>}
      <HorizontalLine />
      <TotalLineItem amount={totalAmount} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    flexDirection: 'column',
    paddingVertical: 25,
  },
  bottomContainer: {
    marginTop: 5,
    flexDirection: 'column',
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
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withTranslation(Namespaces.sendFlow7)(PaymentRequestReviewCard)
)
