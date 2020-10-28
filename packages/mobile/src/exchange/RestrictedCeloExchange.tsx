import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'

interface Props {
  onPressWithdraw: () => void
}

export default function RestrictedCeloExchange({ onPressWithdraw }: Props) {
  const { t } = useTranslation(Namespaces.exchangeFlow9)

  return (
    <>
      <View style={styles.topSpacing} />
      <ItemSeparator />
      <View style={styles.textContainer}>
        <Text style={styles.text}>{t('countryRestrictedExchange')}</Text>
        <View style={styles.infoIconContainer}>
          <InfoIcon size={14} />
        </View>
      </View>
      <ItemSeparator />
      <Button
        size={BtnSizes.FULL}
        text={t('withdrawCelo')}
        onPress={onPressWithdraw}
        style={styles.button}
        type={BtnTypes.TERTIARY}
        testID="WithdrawCELO"
      />
    </>
  )
}

const styles = StyleSheet.create({
  topSpacing: {
    marginTop: Spacing.Thick24,
  },
  textContainer: {
    marginVertical: Spacing.Regular16,
    marginHorizontal: Spacing.Regular16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flexShrink: 1,
    ...fontStyles.small,
  },
  infoIconContainer: {
    marginLeft: Spacing.Smallest8,
  },
  button: {
    marginVertical: Spacing.Regular16,
    marginHorizontal: Spacing.Regular16,
  },
})
