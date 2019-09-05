import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import { MoneyAmount } from '@celo/react-components/components/MoneyAmount'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import LineItemRow from 'src/components/LineItemRow'
import { CURRENCIES, CURRENCY_ENUM as Tokens } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { RecipientWithContact } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import FeeIcon from 'src/send/FeeIcon'
import { getFeeDisplayValue, getMoneyDisplayValue } from 'src/utils/formatting'

export interface OwnProps {
  recipientPhone: string
  recipientContact?: RecipientWithContact
  amount: BigNumber
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
  render() {
    const {
      recipientPhone,
      recipientContact,
      amount,
      fee,
      isLoadingFee,
      feeError,
      currency,
      defaultCountryCode,
      t,
    } = this.props
    const currencySymbol = CURRENCIES[currency].symbol
    const amountWithFees = getMoneyDisplayValue(amount.minus(fee || 0))

    return (
      <View style={[componentStyles.roundedBorder, style.container]}>
        <View style={style.logo}>
          <Logo height={40} />
        </View>
        <MoneyAmount
          symbol={currencySymbol}
          amount={amountWithFees}
          sign={'+'}
          color={colors.celoGreen}
        />
        <HorizontalLine />
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
        </View>
        <View style={style.feeContainer}>
          <LineItemRow
            currencySymbol={currencySymbol}
            amount={amount.toString()}
            title={t('totalSent')}
          />
          <LineItemRow
            currencySymbol={currencySymbol}
            amount={getFeeDisplayValue(fee)}
            title={t('securityFee')}
            titleIcon={<FeeIcon />}
            isLoading={isLoadingFee}
            hasError={!!feeError}
          />
          <LineItemRow
            currencySymbol={currencySymbol}
            amount={amountWithFees}
            title={t('totalRefunded')}
          />
        </View>
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
  feeContainer: {
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  contactName: {
    paddingTop: 6,
    textAlign: 'center',
  },
  logo: {
    alignSelf: 'center',
    margin: 'auto',
    marginVertical: 10,
  },
  details: {
    padding: 20,
  },
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withNamespaces(Namespaces.sendFlow7)(ReclaimPaymentConfirmationCard)
)
