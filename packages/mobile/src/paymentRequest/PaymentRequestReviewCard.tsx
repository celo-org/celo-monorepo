import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import { MoneyAmount } from '@celo/react-components/components/MoneyAmount'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import Avatar from 'src/components/Avatar'
import LineItemRow from 'src/components/LineItemRow'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { getMoneyDisplayValue } from 'src/utils/formatting'

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
class PaymentRequestReviewCard extends React.Component<OwnProps & StateProps & WithNamespaces> {
  renderTopSection = () => {
    const { recipient, address, e164PhoneNumber } = this.props
    return (
      <Avatar
        name={recipient ? recipient.displayName : undefined}
        address={address}
        e164Number={e164PhoneNumber}
      />
    )
  }

  renderAmountSection = () => {
    const { currency, value } = this.props
    return <MoneyAmount symbol={CURRENCIES[currency].symbol} amount={getMoneyDisplayValue(value)} />
  }

  renderBottomSection = () => {
    const { t, dollarBalance, value, comment } = this.props

    return (
      <View style={style.bottomContainer}>
        {!!comment && <Text style={[style.pSmall, componentStyles.paddingTop5]}>{comment}</Text>}
        <HorizontalLine />
        <View style={style.feeContainer}>
          <LineItemRow
            currencySymbol={CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol}
            amount={getMoneyDisplayValue(value.plus(dollarBalance))}
            title={t('newAccountBalance')}
          />
        </View>
      </View>
    )
  }

  render() {
    return (
      <View style={[componentStyles.roundedBorder, style.container]}>
        {this.renderTopSection()}
        {this.renderAmountSection()}
        {this.renderBottomSection()}
      </View>
    )
  }
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
  pSmall: {
    fontSize: 14,
    color: colors.darkSecondary,
    ...fontStyles.light,
    lineHeight: 18,
    textAlign: 'center',
  },
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withNamespaces(Namespaces.sendFlow7)(PaymentRequestReviewCard)
)
