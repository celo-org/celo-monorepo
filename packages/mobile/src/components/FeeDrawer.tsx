import Expandable from '@celo/react-components/components/Expandable'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import { EncryptionFeeIcon, ExchangeFeeIcon, SecurityFeeIcon } from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow.v2'
import { Namespaces } from 'src/i18n'

interface Props {
  isEstimate?: boolean
  currency: CURRENCY_ENUM
  inviteFee?: BigNumber
  isInvite?: boolean
  isExchange?: boolean
  securityFee?: BigNumber
  exchangeFee?: BigNumber
  dekFee?: BigNumber
  showDekfee?: boolean
  feeLoading?: boolean
  feeHasError?: boolean
  totalFee?: BigNumber
  testID?: string
}

export default function FeeDrawer({
  isEstimate,
  currency,
  inviteFee,
  isInvite,
  isExchange,
  securityFee,
  exchangeFee,
  showDekfee,
  dekFee,
  feeLoading,
  feeHasError,
  totalFee,
  testID,
}: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => {
    LayoutAnimation.easeInEaseOut()
    setExpanded(!expanded)
  }

  const title = isEstimate ? t('feeEstimate') : t('feeActual')

  const securityAmount = securityFee && {
    value: securityFee,
    currencyCode: CURRENCIES[currency].code,
  }

  const exchangeAmount = exchangeFee && {
    value: exchangeFee,
    currencyCode: CURRENCIES[currency].code,
  }

  const inviteFeeAmount = inviteFee && {
    value: inviteFee,
    currencyCode: CURRENCIES[currency].code,
  }

  const dekFeeAmount = dekFee && {
    value: dekFee,
    currencyCode: CURRENCIES[currency].code,
  }

  const totalFeeAmount = totalFee && {
    value: totalFee,
    currencyCode: CURRENCIES[currency].code,
  }

  return (
    // Uses View instead of Fragment to workaround a glitch with LayoutAnimation
    <View>
      <Touchable onPress={toggleExpanded} testID={testID}>
        <View style={styles.totalContainer}>
          <Expandable isExpandable={true} isExpanded={expanded}>
            <Text style={styles.title}>{title}</Text>
          </Expandable>
          <LineItemRow
            title={''}
            amount={
              totalFeeAmount && (
                <CurrencyDisplay amount={totalFeeAmount} formatType={FormatType.Fee} />
              )
            }
            isLoading={feeLoading}
            hasError={feeHasError}
          />
        </View>
      </Touchable>
      {expanded && (
        <View>
          {isInvite && inviteFeeAmount && (
            <LineItemRow
              title={t('inviteFee')}
              amount={<CurrencyDisplay amount={inviteFeeAmount} />}
              textStyle={styles.dropDownText}
            />
          )}
          {isExchange && (
            <LineItemRow
              title={t('exchangeFlow9:exchangeFee')}
              titleIcon={<ExchangeFeeIcon />}
              amount={
                exchangeAmount && (
                  <CurrencyDisplay amount={exchangeAmount} formatType={FormatType.Fee} />
                )
              }
              textStyle={styles.dropDownText}
            />
          )}
          {showDekfee && dekFeeAmount && (
            <LineItemRow
              title={t('encryption.feeLabel')}
              titleIcon={<EncryptionFeeIcon />}
              amount={<CurrencyDisplay amount={dekFeeAmount} formatType={FormatType.Fee} />}
              textStyle={styles.dropDownText}
            />
          )}

          <LineItemRow
            title={t('securityFee')}
            titleIcon={<SecurityFeeIcon />}
            amount={
              securityAmount && (
                <CurrencyDisplay amount={securityAmount} formatType={FormatType.Fee} />
              )
            }
            isLoading={feeLoading}
            hasError={feeHasError}
            textStyle={styles.dropDownText}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    ...fontStyles.regular,
    color: colors.dark,
  },
  dropDownText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})
