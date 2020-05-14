import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningModal } from 'src/components/WarningModal'
import { Namespaces } from 'src/i18n'
import { cancelVerification, setRetryWithForno } from 'src/identity/actions'
import { VerificationStatus } from 'src/identity/verification'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface Props {
  verificationStatus: VerificationStatus
  retryWithForno: boolean
  cancelVerification: typeof cancelVerification
  setRetryWithForno: typeof setRetryWithForno
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

  const onRetry = React.useCallback(() => {
    props.setRetryWithForno(false) // Only prompt retry with forno once
    navigate(Screens.VerificationLoadingScreen)
  }, [props.setRetryWithForno])

  const isVisible =
    props.verificationStatus === VerificationStatus.Failed ||
    (props.verificationStatus === VerificationStatus.RevealAttemptFailed && !isDismissed)
  const allowEnterCodes = props.verificationStatus === VerificationStatus.RevealAttemptFailed

  return props.retryWithForno ? (
    // Retry verification with forno with option to skip verificaion
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
    // Skip verification with option to enter codes if reveal attempt failed
    <WarningModal
      isVisible={isVisible}
      header={t('failModal.header')}
      body1={t('promptFornoModal.body')}
      body2={allowEnterCodes ? t('failModal.enterCodesBody') : undefined}
      continueTitle={t('promptFornoModal.switchToDataSaver')}
      cancelTitle={t('global:goBack')} // TODO may need to add text
      onCancel={allowEnterCodes ? onDismiss : undefined}
      onContinue={onSkip}
    />
  )
}
