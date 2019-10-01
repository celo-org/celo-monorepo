import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import { MoneyAmount } from '@celo/react-components/components/MoneyAmount'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { CURRENCIES } from '@celo/utils'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import Avatar from 'src/components/Avatar'
import { FAQ_LINK } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { faucetIcon } from 'src/images/Images'
import { Recipient } from 'src/recipients/recipient'
import { TransactionTypes } from 'src/transactions/reducer'
import { getMoneyDisplayValue, getNetworkFeeDisplayValue } from 'src/utils/formatting'
import { navigateToURI } from 'src/utils/linking'

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

// Bordered content placed in a ReviewFrame
// Differs from TransferReviewCard which is used during Send flow, this is for completed txs
class TransferConfirmationCard extends React.Component<OwnProps & WithNamespaces> {
  onPressGoToFaq = () => {
    navigateToURI(FAQ_LINK)
  }

  renderTopSection = () => {
    const { address, recipient, type, e164PhoneNumber } = this.props
    if (
      type === TransactionTypes.VERIFICATION_FEE ||
      type === TransactionTypes.NETWORK_FEE ||
      type === TransactionTypes.FAUCET
    ) {
      return <Image source={faucetIcon} style={style.icon} />
    } else {
      return (
        <Avatar
          recipient={recipient}
          address={address}
          e164Number={e164PhoneNumber}
          iconSize={iconSize}
        />
      )
    }
  }

  renderAmountSection = () => {
    const { currency, type, value } = this.props

    switch (type) {
      case TransactionTypes.INVITE_SENT: // fallthrough
      case TransactionTypes.INVITE_RECEIVED:
        return null
      case TransactionTypes.NETWORK_FEE:
        return (
          <MoneyAmount
            symbol={CURRENCIES[currency].symbol}
            amount={getNetworkFeeDisplayValue(value, true)}
          />
        )
      default:
        return (
          <MoneyAmount symbol={CURRENCIES[currency].symbol} amount={getMoneyDisplayValue(value)} />
        )
    }
  }

  renderBottomSection = () => {
    const { t, currency, comment, type, value } = this.props

    if (type === TransactionTypes.VERIFICATION_FEE) {
      return <Text style={style.pSmall}>{t('receiveFlow8:verificationMessage')}</Text>
    } else if (type === TransactionTypes.FAUCET) {
      return (
        <Text style={style.pSmall}>
          {t('receiveFlow8:receivedAmountFromCelo.0')}
          {CURRENCIES[currency].symbol}
          {getMoneyDisplayValue(this.props.value)}
          {t('receiveFlow8:receivedAmountFromCelo.1')}
        </Text>
      )
    } else if (type === TransactionTypes.NETWORK_FEE) {
      return (
        <View>
          <Text style={style.pSmall}>
            {t('walletFlow5:networkFeeExplanation.0')}
            <Text onPress={this.onPressGoToFaq} style={fontStyles.link}>
              {t('walletFlow5:networkFeeExplanation.1')}
            </Text>
          </Text>
        </View>
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

          <MoneyAmount symbol={CURRENCIES[currency].symbol} amount={getMoneyDisplayValue(value)} />
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
    paddingVertical: 25,
    paddingHorizontal: 40,
  },
  bottomContainer: {
    marginTop: 5,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  icon: {
    height: iconSize,
    width: iconSize,
    marginTop: 25,
    marginBottom: 40,
    alignSelf: 'center',
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

export default withNamespaces(Namespaces.sendFlow7)(TransferConfirmationCard)
