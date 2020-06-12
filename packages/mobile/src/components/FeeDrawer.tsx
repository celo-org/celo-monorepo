import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import Expandable from 'src/components/Expandable'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow.v2'
import { Namespaces } from 'src/i18n'

interface Props {
  isEstimate?: boolean
  currency: CURRENCY_ENUM
  inviteFee?: BigNumber
  isInvite?: boolean
  securityFee?: BigNumber
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
  securityFee,
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

  const inviteFeeAmount = inviteFee && {
    value: inviteFee,
    currencyCode: CURRENCIES[currency].code,
  }

  const totalFeeAmount = totalFee && {
    value: totalFee,
    currencyCode: CURRENCIES[currency].code,
  }

  return (
    <>
      <Touchable testID={testID} onPress={toggleExpanded}>
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
          <LineItemRow
            title={t('securityFee')}
            titleIcon={<FeeIcon />}
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
    </>
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
