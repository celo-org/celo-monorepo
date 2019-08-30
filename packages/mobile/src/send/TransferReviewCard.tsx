import { Avatar } from '@celo/react-components/components/Avatar'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import LineItemRow from 'src/components/LineItemRow'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import FeeIcon from 'src/send/FeeIcon'
import { TransactionTypes } from 'src/transactions/reducer'
import { getCurrencyStyles } from 'src/transactions/TransferFeedItem'
import { getFeeDisplayValue, getMoneyDisplayValue } from 'src/utils/formatting'

const iconSize = 40

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

interface StateProps {
  defaultCountryCode: string
  dollarBalance: BigNumber
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    defaultCountryCode: state.account.defaultCountryCode,
    dollarBalance: new BigNumber(state.stableToken.balance || 0),
  }
}

// Bordered content placed in a ReviewFrame
// Differs from TransferConfirmationCard which is used for viewing completed txs
class TransferReviewCard extends React.Component<OwnProps & StateProps & WithNamespaces> {
  renderTopSection = () => {
    const { recipient, address, e164PhoneNumber, defaultCountryCode } = this.props
    return (
      <View style={style.avatar}>
        <Avatar
          name={recipient ? recipient.displayName : undefined}
          address={address}
          e164Number={e164PhoneNumber}
          defaultCountryCode={defaultCountryCode}
          iconSize={iconSize}
        />
      </View>
    )
  }

  renderAmountSection = () => {
    const { type, currency } = this.props
    const currencyStyle = getCurrencyStyles(currency, type)
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
    const { t, type, dollarBalance, value, comment, fee, isLoadingFee, feeError } = this.props
    const amountWithFees = value.plus(fee || 0)
    const adjustedFee =
      type === TransactionTypes.INVITE_SENT && fee
        ? fee.minus(getInvitationVerificationFee(false))
        : fee

    return (
      <View style={style.bottomContainer}>
        {!!comment && <Text style={[style.pSmall, componentStyles.paddingTop5]}>{comment}</Text>}
        <HorizontalLine />
        <View style={style.feeContainer}>
          {type === TransactionTypes.PAY_REQUEST && (
            <LineItemRow
              currencySymbol={CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol}
              amount={getMoneyDisplayValue(value.plus(dollarBalance))}
              title={t('newAccountBalance')}
            />
          )}
          {type !== TransactionTypes.PAY_REQUEST && (
            <>
              {type === TransactionTypes.INVITE_SENT && (
                <LineItemRow
                  currencySymbol={CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol}
                  amount={getMoneyDisplayValue(getInvitationVerificationFee(false))}
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
            </>
          )}
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
  feeContainer: {
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'stretch',
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
})

export default componentWithAnalytics(
  connect<StateProps, {}, {}, RootState>(mapStateToProps)(
    withNamespaces(Namespaces.sendFlow7)(TransferReviewCard)
  )
)
