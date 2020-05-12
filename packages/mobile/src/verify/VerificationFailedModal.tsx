import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { Namespaces } from 'src/i18n'
import { cancelVerification } from 'src/identity/actions'
import { VerificationStatus } from 'src/identity/verification'
import { navigateHome } from 'src/navigator/NavigationService'

interface Props {
  verificationStatus: VerificationStatus
  cancelVerification: typeof cancelVerification
}

export function VerificationFailedModal(props: Props) {
  const { t } = useTranslation(Namespaces.nuxVerification2)
  const [isDismissed, setIsDismissed] = React.useState(false)

  const onDismiss = React.useCallback(() => {
    setIsDismissed(true)
  }, [setIsDismissed])

  const onSkip = React.useCallback(() => {
    props.cancelVerification()
    navigateHome()
  }, [props.cancelVerification])

  const isVisible =
    props.verificationStatus === VerificationStatus.Failed ||
    (props.verificationStatus === VerificationStatus.RevealAttemptFailed && !isDismissed)

  const showRetryWithForno = props.verificationStatus === VerificationStatus.Failed

  const allowEnterCodes = props.verificationStatus === VerificationStatus.RevealAttemptFailed

  return (
    <Modal isVisible={isVisible}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalHeader}>
          {showRetryWithForno ? t('retryWithFornoModal.header') : t('failModal.header')}
        </Text>
        <Text style={fontStyles.body}>
          {showRetryWithForno ? t('retryWithFornoModal.body1') : t('failModal.body1')}
        </Text>
        <Text style={[fontStyles.body, componentStyles.marginTop10]}>
          {showRetryWithForno
            ? t('retryWithFornoModal.body2')
            : t('failModal.body2') + (allowEnterCodes ? t('failModal.enterCodesBody') : '')}
        </Text>
        <View style={styles.modalButtonsContainer}>
          {allowEnterCodes && (
            <TextButton onPress={onDismiss} style={styles.modalSkipText}>
              {t('failModal.enterCodesButton')}
            </TextButton>
          )}
          <TextButton onPress={onSkip} style={styles.modalSkipText}>
            {t('missingCodesModal.skip')}
          </TextButton>
        </View>
      </View>
    </Modal>
  )
}

function RetryVerificationWithFornoModal(props: Props) {
  const test = 'hi'
  return (
    <>
      <Text style={styles.modalHeader}>{t('retryWithFornoModal.header')}</Text>
      <Text style={fontStyles.body}>{t('retryWithFornoModal.body1')}</Text>
      <Text style={[fontStyles.body, componentStyles.marginTop10]}>
        {t('retryWithFornoModal.body2')}
      </Text>
      <View style={styles.modalButtonsContainer}>
        <TextButton onPress={onSkip} style={styles.modalSkipText}>
          {t('missingCodesModal.skip')}
        </TextButton>
        <TextButton onPress={onRetry} style={styles.modalSkipText}>
          {t('retryWithFornoModal.retryButton')}
        </TextButton>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 4,
  },
  modalHeader: {
    ...fontStyles.h2,
    ...fontStyles.bold,
    marginVertical: 15,
    color: colors.errorRed,
  },
  modalButtonsContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  modalSkipText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
  },
})
