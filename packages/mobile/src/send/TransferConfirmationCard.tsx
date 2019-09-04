import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import Avatar from 'src/components/Avatar'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { faucetIcon } from 'src/images/Images'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { TransactionTypes } from 'src/transactions/reducer'
import { getCurrencyStyles } from 'src/transactions/TransferFeedItem'
import { getMoneyDisplayValue } from 'src/utils/formatting'

const iconSize = 40

export interface OwnProps {
  address?: string
  comment?: string
  value: BigNumber
  currency: CURRENCY_ENUM
  type: TransactionTypes
  e164PhoneNumber?: string
  dollarBalance?: BigNumber
  recipient?: Recipient
}

interface StateProps {
  defaultCountryCode: string
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    defaultCountryCode: state.account.defaultCountryCode,
  }
}

// Bordered content placed in a ReviewFrame
// Differs from TransferReviewCard which is used during Send flow, this is for completed txs
class TransferConfirmationCard extends React.Component<OwnProps & StateProps & WithNamespaces> {
  renderTopSection = () => {
    const { address, recipient, type, e164PhoneNumber, defaultCountryCode } = this.props
    if (type === TransactionTypes.VERIFICATION_FEE || type === TransactionTypes.FAUCET) {
      return <Image source={faucetIcon} style={style.icon} />
    } else {
      return (
        <View style={style.avatar}>
          <Avatar
            recipient={recipient}
            address={address}
            e164PhoneNumber={e164PhoneNumber}
            defaultCountryCode={defaultCountryCode}
          />
        </View>
      )
    }
  }

  renderAmountSection = () => {
    const { currency, type } = this.props
    const currencyStyle = getCurrencyStyles(currency, type)

    if (type === TransactionTypes.INVITE_SENT || type === TransactionTypes.INVITE_RECEIVED) {
      return null
    }

    return (
      <View style={style.amountContainer}>
        <Text style={[style.plusSign, { color: currencyStyle.color }]}>
          {currencyStyle.direction}
        </Text>
        <Text style={[style.currencySymbol, { color: currencyStyle.color }]}>
          {currencyStyle.symbol}
        </Text>
        <Text
          style={[style.amount, { color: currencyStyle.color }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getMoneyDisplayValue(this.props.value)}
        </Text>
      </View>
    )
  }

  renderBottomSection = () => {
    const { t, currency, comment, type, value } = this.props
    const currencyStyle = getCurrencyStyles(currency, type)

    if (type === TransactionTypes.VERIFICATION_FEE) {
      return <Text style={style.pSmall}>{t('receiveFlow8:verificationMessage')}</Text>
    } else if (type === TransactionTypes.FAUCET) {
      return (
        <Text style={style.pSmall}>
          {t('receiveFlow8:receivedAmountFromCelo.0')}
          {currencyStyle.symbol}
          {getMoneyDisplayValue(this.props.value)}
          {t('receiveFlow8:receivedAmountFromCelo.1')}
        </Text>
      )
    } else if (type === TransactionTypes.INVITE_SENT || type === TransactionTypes.INVITE_RECEIVED) {
      return (
        <View style={style.bottomContainer}>
          <View style={style.inviteLine}>
            <HorizontalLine />
          </View>
          <Text style={style.inviteTitle}>{t('inviteFlow11:inviteFee')}</Text>
          {type === TransactionTypes.INVITE_SENT ? (
            <Text style={style.pSmall}>{t('inviteFlow11:whySendFees')}</Text>
          ) : (
            <Text style={style.pSmall}>{t('inviteFlow11:whyReceiveFees')}</Text>
          )}
          <View style={style.amountContainer}>
            <Text style={[style.currencySymbol, { color: currencyStyle.color }]}>
              {currencyStyle.symbol}
            </Text>
            <Text
              style={[style.amount, { color: currencyStyle.color }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {getMoneyDisplayValue(value)}
            </Text>
          </View>
        </View>
      )
    } else if (comment) {
      // When we want to add more info to the send tx drilldown, that will go here
      return <Text style={[style.pSmall, componentStyles.paddingTop5]}>{comment}</Text>
    }
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
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  amountContainer: {
    flexDirection: 'row',
    marginHorizontal: 25,
    marginTop: 15,
    alignSelf: 'center',
  },
  amount: {
    ...fontStyles.regular,
    fontSize: 48,
    lineHeight: 64,
    color: colors.darkSecondary,
  },
  bottomContainer: {
    marginTop: 5,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  icon: {
    height: iconSize,
    width: iconSize,
    marginTop: 30,
    marginBottom: 40,
    alignSelf: 'center',
  },
  plusSign: {
    ...fontStyles.regular,
    fontSize: 34,
  },
  currencySymbol: {
    ...fontStyles.regular,
    textAlignVertical: 'top',
    fontSize: 24,
    color: colors.darkSecondary,
  },
  avatar: {
    marginTop: 5,
  },
  pSmall: {
    fontSize: 14,
    color: colors.darkSecondary,
    ...fontStyles.light,
    lineHeight: 18,
    textAlign: 'center',
  },
  inviteLine: {
    marginVertical: 30,
  },
  inviteTitle: {
    ...fontStyles.pCurrency,
    textAlign: 'center',
    marginBottom: 5,
  },
})

export default componentWithAnalytics(
  connect<StateProps, {}, {}, RootState>(mapStateToProps)(
    withNamespaces(Namespaces.sendFlow7)(TransferConfirmationCard)
  )
)
