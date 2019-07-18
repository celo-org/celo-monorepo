import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { getContactPhoneNumber } from '@celo/utils/src/contacts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { MinimalContact } from 'react-native-contacts'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { RootState } from 'src/redux/reducers'
import FeeIcon from 'src/send/FeeIcon'
import { getCurrencyColor, getMoneyDisplayValue } from 'src/utils/formatting'

interface LineItemProps {
  currencySymbol: string
  amount: BigNumber
  title: string
  titleIcon?: React.ReactNode
  negative?: boolean
  boldedStyle?: boolean
}

function LineItemRow({
  currencySymbol,
  amount,
  title,
  titleIcon,
  negative,
  boldedStyle,
}: LineItemProps) {
  const fontStyle = boldedStyle ? fontStyles.bodyBold : fontStyles.body
  const totalStyle = boldedStyle ? style.totalGreen : style.total
  return (
    <View style={style.lineItemRow}>
      <View style={style.feeRow}>
        <Text style={[fontStyle, style.totalTitle]}>{title}</Text>
        {titleIcon}
      </View>
      <Text style={[fontStyle, totalStyle]}>
        {negative && '-'}
        {currencySymbol}
        {getMoneyDisplayValue(amount)}
      </Text>
    </View>
  )
}

export interface OwnProps {
  recipient: MinimalContact | string
  amount: BigNumber
  comment?: string
  fee?: BigNumber
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

type Props = OwnProps & StateProps & WithNamespaces

class ReclaimPaymentConfirmationCard extends React.PureComponent<Props> {
  renderFeeAndTotal = (total: BigNumber, currencySymbol: string, fee?: BigNumber) => {
    if (!fee) {
      return
    }

    const { t } = this.props
    const amountWithFees = total.minus(this.props.fee || 0)

    return (
      <View style={style.feeContainer}>
        <LineItemRow currencySymbol={'$'} amount={total} title={t('totalSent')} />
        <LineItemRow
          currencySymbol={currencySymbol}
          amount={fee}
          title={t('securityFee')}
          titleIcon={<FeeIcon />}
          negative={true}
        />
        <LineItemRow
          currencySymbol={'$'}
          amount={amountWithFees}
          title={t('totalRefunded')}
          boldedStyle={true}
        />
      </View>
    )
  }

  render() {
    const { recipient, amount, comment, fee, currency, defaultCountryCode } = this.props
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
            {getMoneyDisplayValue(amount.minus(this.props.fee || 0))}
          </Text>
        </View>
        <View style={style.horizontalLine} />
        <View style={style.details}>
          {typeof recipient !== 'string' && (
            <Text style={[fontStyles.bodySmallSemiBold, style.contactName]}>
              {recipient.displayName}
            </Text>
          )}
          {typeof recipient !== 'string' ? (
            <PhoneNumberWithFlag
              e164PhoneNumber={getContactPhoneNumber(recipient) || ''}
              defaultCountryCode={defaultCountryCode}
            />
          ) : (
            <PhoneNumberWithFlag
              e164PhoneNumber={recipient}
              defaultCountryCode={defaultCountryCode}
            />
          )}
          {!!comment && <Text style={[fontStyles.bodySecondary, style.comment]}>{comment}</Text>}
        </View>
        {this.renderFeeAndTotal(amount, currencySymbol, fee)}
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 10,
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
  },
  feeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  lineItemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  totalTitle: {
    lineHeight: 28,
    marginLeft: 10,
    left: 1,
  },
  total: {
    right: 1,
    marginRight: 10,
    lineHeight: 28,
  },
  totalGreen: {
    right: 1,
    marginRight: 10,
    lineHeight: 28,
    color: colors.celoGreen,
  },
  currencySymbol: {
    fontSize: 30,
    lineHeight: 40,
    height: 35,
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
