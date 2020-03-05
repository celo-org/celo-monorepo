import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useExchangeRate, useLocalCurrencyCode } from 'src/localCurrency/hooks'
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
  amount,
  fee,
  isLoadingFee,
  feeError,
  currency,
  defaultCountryCode,
  t,
}: Props) {
  const localCurrencyCode = useLocalCurrencyCode()
  const exchangeRate = useExchangeRate()
  const amountWithFees = {
    value: amount.minus(fee || 0).toString(),
    currencyCode: CURRENCIES[currency].code,
  }
  const isUsdLocalCurrency = localCurrencyCode === LocalCurrencyCode.USD

  return (
    <View style={[componentStyles.roundedBorder, style.container]}>
      <View style={style.logo}>
        <Logo height={40} />
      </View>
      <CurrencyDisplay
        type={DisplayType.Big}
        amount={amountWithFees}
        showExplicitPositiveSign={true}
        useColors={true}
        hideCode={isUsdLocalCurrency}
      />
      <HorizontalLine />
      <View style={style.details}>
        {recipientContact && (
          <Text style={[fontStyles.bodySmallSemiBold, style.contactName]}>
            {recipientContact.displayName}
          </Text>
        )}
        {recipientPhone && (
          <PhoneNumberWithFlag
            e164PhoneNumber={recipientPhone}
            defaultCountryCode={defaultCountryCode}
          />
        )}
      </View>
      <View style={style.feeContainer}>
        {/* <LineItemRow amount={amount.toString()} title={t('totalSent')} /> */}
        {!isUsdLocalCurrency && exchangeRate && (
          <>
            <LineItemRow
              title={t('totalSentInCeloDollars')}
              amount={
                <CurrencyDisplay
                  amount={{ value: amount.toString(), currencyCode: CURRENCIES[currency].code }}
                  showLocalAmount={false}
                  hideSymbol={true}
                />
              }
            />
            <Text style={style.localValueHint}>
              <Trans i18nKey="localValueHint" ns={Namespaces.sendFlow7}>
                @{' '}
                <CurrencyDisplay
                  amount={{
                    value: new BigNumber(exchangeRate).pow(-1).toString(),
                    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                  }}
                  showLocalAmount={false}
                />
              </Trans>
            </Text>
          </>
        )}
        <LineItemRow
          title={t('securityFee')}
          titleIcon={<FeeIcon />}
          amount={
            fee && (
              <CurrencyDisplay
                amount={{
                  value: fee.toString(),
                  currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                }}
                formatType={FormatType.Fee}
                showLocalAmount={false}
                hideSymbol={true}
              />
            )
          }
          isLoading={isLoadingFee}
          hasError={!!feeError}
        />
        <LineItemRow
          title={t('totalRefunded')}
          amount={
            <CurrencyDisplay amount={amountWithFees} showLocalAmount={false} hideSymbol={true} />
          }
        />
      </View>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  feeContainer: {
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
  localValueHint: {
    ...fontStyles.light,
    fontSize: 14,
    lineHeight: 20,
    color: colors.lightGray,
    marginBottom: 3,
  },
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withTranslation(Namespaces.sendFlow7)(ReclaimPaymentConfirmationCard)
)
