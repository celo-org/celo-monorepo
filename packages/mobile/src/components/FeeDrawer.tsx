import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow.v2'
import { Namespaces } from 'src/i18n'

interface Props {
  isEstimate?: boolean
  currency: CURRENCY_ENUM
  inviteFee?: BigNumber
  securityFee?: BigNumber
  securityFeeLoading?: boolean
  securityFeeHasError?: boolean
}

export default function FeeDrawer({
  isEstimate,
  inviteFee,
  securityFee,
  currency,
  securityFeeLoading,
  securityFeeHasError,
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

  return (
    <View>
      <Touchable onPress={toggleExpanded}>
        <Text style={styles.title}>{title}</Text>
      </Touchable>
      {expanded && (
        <View style={styles.expandedContainer}>
          {inviteFeeAmount && (
            <LineItemRow
              title={t('inviteFee')}
              amount={<CurrencyDisplay amount={inviteFeeAmount} />}
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
            isLoading={securityFeeLoading}
            hasError={securityFeeHasError}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  expandedContainer: {
    marginTop: 8,
  },
  title: {
    ...fontStyles.regular,
    color: colors.dark,
  },
  accountBox: {
    borderRadius: 4,
    backgroundColor: colors.gray2,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  accountLabel: {
    ...fontStyles.label,
    color: colors.gray4,
    marginRight: 30,
  },
})
