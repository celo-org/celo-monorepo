import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import { CURRENCIES, CURRENCY_ENUM as Tokens } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { RecipientWithContact } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import FeeIcon from 'src/send/FeeIcon'
import { getCurrencyColor, getMoneyDisplayValue, roundedUpNumber } from 'src/utils/formatting'

interface LineItemProps {
  currencySymbol: string
  amount?: BigNumber
  title: string
  titleIcon?: React.ReactNode
  negative?: boolean
  boldedStyle?: boolean
  isLoading?: boolean
  hasError?: boolean
}

function LineItemRow({
  currencySymbol,
  amount,
  title,
  titleIcon,
  negative,
  boldedStyle,
  isLoading,
  hasError,
}: LineItemProps) {
  const fontStyle = boldedStyle ? fontStyles.bodyBold : fontStyles.body
  const totalStyle = boldedStyle ? style.totalGreen : style.total
  return (
    <View style={style.lineItemRow}>
      <View style={style.feeRow}>
        <Text style={[fontStyle, style.totalTitle]}>{title}</Text>
        {titleIcon}
      </View>
      {amount && (
        <Text style={[fontStyle, totalStyle]}>
          {negative && '-'}
          {currencySymbol}
          {getMoneyDisplayValue(amount)}
        </Text>
      )}
      {hasError && <Text style={[fontStyle, totalStyle]}>---</Text>}
      {isLoading && (
        <View style={style.loadingContainer}>
          <ActivityIndicator size="small" color={colors.celoGreen} />
        </View>
      )}
    </View>
  )
}

export interface OwnProps {
  recipientPhone: string
  recipientContact?: RecipientWithContact
  amount: BigNumber
  comment?: string
  fee?: BigNumber
  isLoadingFee?: boolean
  feeError?: Error
  currency: Tokens
}

interface StateProps {
  defaultCountryCode: string
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    defaultCountryCode: state.account.defaultCountryCode,
  }
}

type Props = OwnProps & StateProps & WithNamespaces

class ReclaimPaymentConfirmationCard extends React.PureComponent<Props> {
  renderFeeAndTotal = (
    total: BigNumber,
    currencySymbol: string,
    fee: BigNumber | undefined,
    isLoadingFee: boolean | undefined,
    feeError: Error | undefined
  ) => {
    const { t } = this.props
    const amountWithFees = total.minus(fee || 0)
    const dollarSymbol = CURRENCIES[Tokens.DOLLAR].symbol

    return (
      <View style={style.feeContainer}>
        <LineItemRow currencySymbol={dollarSymbol} amount={total} title={t('totalSent')} />
        <LineItemRow
          currencySymbol={currencySymbol}
          amount={fee && roundedUpNumber(fee)}
          title={t('securityFee')}
          titleIcon={<FeeIcon />}
          negative={true}
          isLoading={isLoadingFee}
          hasError={!!feeError}
        />
        <LineItemRow
          currencySymbol={dollarSymbol}
          amount={amountWithFees}
          title={t('totalRefunded')}
          boldedStyle={true}
        />
      </View>
    )
  }

  render() {
    const {
      recipientPhone,
      recipientContact,
      amount,
      comment,
      fee,
      isLoadingFee,
      feeError,
      currency,
      defaultCountryCode,
    } = this.props
    const currencySymbol = CURRENCIES[currency].symbol
    const currencyColor = getCurrencyColor(currency)
    return (
      <View style={[componentStyles.roundedBorder, style.container]}>
        <View style={style.logo}>
          <Logo height={40} />
        </View>
        <View style={style.amountContainer}>
          <Text style={[fontStyles.body, style.currencySymbol, { color: currencyColor }]}>
            {currencySymbol}
          </Text>
          <Text style={[fontStyles.body, style.amount, { color: currencyColor }]}>
            {getMoneyDisplayValue(amount.minus(fee || 0))}
          </Text>
        </View>
        <View style={style.horizontalLine} />
        <View style={style.details}>
          {recipientContact && (
            <Text style={[fontStyles.bodySmallSemiBold, style.contactName]}>
              {recipientContact.displayName}
            </Text>
          )}
          <PhoneNumberWithFlag
            e164PhoneNumber={recipientPhone}
            defaultCountryCode={defaultCountryCode}
          />
          {!!comment && <Text style={[fontStyles.bodySecondary, style.comment]}>{comment}</Text>}
        </View>
        {this.renderFeeAndTotal(amount, currencySymbol, fee, isLoadingFee, feeError)}
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  amountContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  amount: {
    fontSize: 48,
    lineHeight: 60,
    color: colors.darkSecondary,
  },
  comment: {
    alignSelf: 'center',
    textAlign: 'center',
  },
  feeContainer: {
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  feeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalTitle: {
    lineHeight: 28,
  },
  total: {
    lineHeight: 28,
  },
  totalGreen: {
    lineHeight: 28,
    color: colors.celoGreen,
  },
  currencySymbol: {
    fontSize: 30,
    lineHeight: 40,
    height: 35,
  },
  loadingContainer: {
    transform: [{ scale: 0.8 }],
  },
  contactName: {
    paddingTop: 6,
    textAlign: 'center',
  },
  logo: {
    alignSelf: 'center',
    margin: 'auto',
    padding: 20,
  },
  details: {
    padding: 20,
  },
  horizontalLine: {
    width: '100%',
    borderStyle: 'solid',
    borderTopWidth: 1,
    borderTopColor: colors.darkLightest,
  },
})

export default componentWithAnalytics(
  connect<StateProps, {}, {}, RootState>(mapStateToProps)(
    withNamespaces(Namespaces.sendFlow7)(ReclaimPaymentConfirmationCard)
  )
)
