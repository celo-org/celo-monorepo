import { Avatar } from '@celo/react-components/components/Avatar'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { faucetIcon } from 'src/images/Images'
import { RootState } from 'src/redux/reducers'
import FeeIcon from 'src/send/FeeIcon'
import { TransactionTypes } from 'src/transactions/reducer'
import { getCurrencyStyles } from 'src/transactions/TransferFeedItem'
import { getMoneyDisplayValue } from 'src/utils/formatting'
import { Recipient } from 'src/utils/recipient'

const iconSize = 40

interface LineItemProps {
  currencySymbol: string
  amount: BigNumber
  title: string
  titleIcon?: React.ReactNode
}

function LineItemRow({ currencySymbol, amount, title, titleIcon }: LineItemProps) {
  return (
    <View style={style.lineItemRow}>
      <View style={style.feeDescription}>
        <Text style={style.feeText}>{title}</Text>
        {titleIcon}
      </View>
      <Text style={style.feeText}>
        {currencySymbol}
        {getMoneyDisplayValue(amount, 4)}
      </Text>
    </View>
  )
}

function HorizontalLine() {
  return (
    <View
      style={{
        width: '100%',
        borderStyle: 'solid',
        borderTopWidth: 1,
        borderTopColor: colors.darkLightest,
        marginTop: 10,
      }}
    />
  )
}

export interface OwnProps {
  address?: string
  comment?: string
  value: BigNumber
  currency: CURRENCY_ENUM
  fee?: BigNumber
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

// TODO @cmcewen: i18n the currency displays (#1526)
class TransferConfirmationCard extends React.Component<OwnProps & StateProps & WithNamespaces> {
  renderTopSection = (
    type: TransactionTypes,
    recipient: Recipient | undefined,
    address: string | undefined,
    e164PhoneNumber: string | undefined,
    defaultCountryCode: string
  ) => {
    if (type === TransactionTypes.VERIFICATION_FEE || type === TransactionTypes.FAUCET) {
      return <Image source={faucetIcon} style={style.icon} />
    } else {
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
  }

  renderAmountSection = (type: TransactionTypes, currency: CURRENCY_ENUM) => {
    const currencyStyle = getCurrencyStyles(currency, type)

    if (type === TransactionTypes.INVITE_SENT || type === TransactionTypes.INVITE_RECEIVED) {
      return null
    } else {
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
  }

  renderBottomSection = (
    type: TransactionTypes,
    total: BigNumber,
    fee: BigNumber | undefined,
    currency: CURRENCY_ENUM,
    comment?: string,
    address?: string
  ) => {
    const { t } = this.props
    const currencyStyle = getCurrencyStyles(currency, type)
    const amountWithFees = total.plus(this.props.fee || 0)

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
              {getMoneyDisplayValue(this.props.value)}
            </Text>
          </View>
        </View>
      )
    } else {
      return (
        <View style={style.bottomContainer}>
          {!!comment && <Text style={[style.pSmall, componentStyles.paddingTop5]}>{comment}</Text>}
          {(!!this.props.dollarBalance || !!fee) && <HorizontalLine />}
          {!!this.props.dollarBalance && (
            <View style={style.celoDollarBalance}>
              <Text style={style.feeText}>
                {`${this.props.t('paymentRequestFlow:celoDollarBalance')} `}
                <Text style={componentStyles.colorGreen}>
                  {getMoneyDisplayValue(this.props.dollarBalance)}
                </Text>
              </Text>
            </View>
          )}
          {!!fee && (
            <View style={style.feeContainer}>
              {this.props.type === TransactionTypes.PAY_REQUEST && (
                <LineItemRow currencySymbol={'$'} amount={total} title={t('dollarsSent')} />
              )}
              <LineItemRow
                currencySymbol={currencyStyle.symbol}
                amount={fee}
                title={address ? t('securityFee') : t('inviteAndSecurityFee')}
                titleIcon={<FeeIcon />}
              />
              <LineItemRow currencySymbol={'$'} amount={amountWithFees} title={t('total')} />
            </View>
          )}
        </View>
      )
    }
  }

  render() {
    const {
      address,
      recipient,
      value,
      currency,
      comment,
      fee,
      type,
      e164PhoneNumber,
      defaultCountryCode,
    } = this.props

    return (
      <View style={[componentStyles.roundedBorder, style.container]}>
        {this.renderTopSection(type, recipient, address, e164PhoneNumber, defaultCountryCode)}
        {this.renderAmountSection(type, currency)}
        {this.renderBottomSection(type, value, fee, currency, comment, address)}
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    flexDirection: 'column',
    padding: 20,
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
  largeAmount: {
    fontSize: 80,
    lineHeight: 102,
  },
  bottomContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  feeContainer: {
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  feeDescription: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  celoDollarBalance: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginTop: 20,
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
  largeCurrencySymbol: {
    fontSize: 32,
  },
  feeText: {
    ...fontStyles.subSmall,
    color: colors.dark,
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
