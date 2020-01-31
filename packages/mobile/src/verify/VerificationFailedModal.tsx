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

  const allowEnterCodes = props.verificationStatus === VerificationStatus.RevealAttemptFailed

  return (
    <Modal isVisible={isVisible}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalHeader}>{t('failModal.header')}</Text>
        <Text style={fontStyles.body}>{t('failModal.body1')}</Text>
        <Text style={[fontStyles.body, componentStyles.marginTop10]}>
          {t('failModal.body2') + (allowEnterCodes ? t('failModal.enterCodesBody') : '')}
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
