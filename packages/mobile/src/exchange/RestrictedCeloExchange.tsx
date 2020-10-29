import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import { Spacing } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { GOLD_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { Namespaces } from 'src/i18n'

interface Props {
  onPressWithdraw: () => void
}

// Actions container for CP-DOTO restricted countries
export default function RestrictedCeloExchange({ onPressWithdraw }: Props) {
  const { t } = useTranslation(Namespaces.exchangeFlow9)

  const goldBalance = useSelector(celoTokenBalanceSelector)

  const hasGold = new BigNumber(goldBalance || 0).isGreaterThan(GOLD_TRANSACTION_MIN_AMOUNT)

  if (!hasGold) {
    return <View style={styles.emptyContainer} />
  }

  return (
    <Button
      size={BtnSizes.FULL}
      text={t('withdrawCelo')}
      onPress={onPressWithdraw}
      style={styles.button}
      type={BtnTypes.TERTIARY}
      testID="WithdrawCELO"
    />
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    marginTop: Spacing.Thick24,
  },
  button: {
    marginTop: Spacing.Thick24,
    marginBottom: Spacing.Regular16,
    marginHorizontal: Spacing.Regular16,
  },
})
