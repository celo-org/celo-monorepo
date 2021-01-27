import fontStyles from '@celo/react-components/styles/fonts'
import React, { useLayoutEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { LayoutAnimation, StyleSheet, Text } from 'react-native'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'

interface Props {
  isVisible: boolean
  secondsLeft: number
  onPressBack: () => void
  onPressSkip: () => void
}

export default function VerificationInputHelpDialog({
  isVisible,
  secondsLeft,
  onPressBack,
  onPressSkip,
}: Props) {
  const { t } = useTranslation(Namespaces.onboarding)
  const translationContext = secondsLeft > 0 ? 'countdown' : null

  // Animates when countdown becomes inactive
  useLayoutEffect(() => LayoutAnimation.easeInEaseOut(), [translationContext])

  return (
    <Dialog
      title={t('verificationInputHelpDialog.title')}
      isVisible={isVisible}
      actionText={t('verificationInputHelpDialog.back')}
      actionPress={onPressBack}
      secondaryActionPress={onPressSkip}
      secondaryActionDisabled={secondsLeft > 0}
      secondaryActionText={t('verificationInputHelpDialog.skip')}
      testID="VerificationInputHelpDialog"
    >
      <Text style={styles.body}>
        <Trans
          i18nKey="verificationInputHelpDialog.body"
          ns={Namespaces.onboarding}
          tOptions={{ context: translationContext }}
          count={secondsLeft}
        >
          <Text style={fontStyles.regular600} />
          <Text style={fontStyles.regular600} />
        </Trans>
      </Text>
    </Dialog>
  )
}

const styles = StyleSheet.create({
  body: {
    // Prevents text from moving while the countdown is active
    fontVariant: ['tabular-nums'],
  },
})
