import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningModal } from 'src/components/WarningModal'
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

  const onRetry = () => {
    // TODO retry verification
  }

  const isVisible =
    props.verificationStatus === VerificationStatus.Failed ||
    (props.verificationStatus === VerificationStatus.RevealAttemptFailed && !isDismissed)

  // TODO may need to check
  const showRetryWithForno = props.verificationStatus === VerificationStatus.Failed // TODO some check to only show modal once

  const allowEnterCodes = props.verificationStatus === VerificationStatus.RevealAttemptFailed

  return showRetryWithForno ? (
    <WarningModal
      isVisible={isVisible}
      header={t('retryWithFornoModal.header')}
      body1={t('retryWithFornoModal.body1')}
      body2={t('retryWithFornoModal.body2')}
      continueTitle={t('retryWithFornoModal.retryButton')}
      cancelTitle={t('skip')} // TODO(anna) make sure translation works
      onCancel={onSkip}
      onContinue={onRetry}
    />
  ) : (
    <WarningModal
      isVisible={isVisible}
      header={t('failModal.header')}
      body1={t('promptFornoModal.body')}
      body2={allowEnterCodes ? t('failModal.enterCodesBody') : undefined}
      continueTitle={t('promptFornoModal.switchToDataSaver')}
      cancelTitle={t('global:goBack')}
      onCancel={allowEnterCodes ? onDismiss : undefined}
      onContinue={onSkip}
    />
  )
}
