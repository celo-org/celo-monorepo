import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { setRetryVerificationWithForno } from 'src/account/actions'
import { WarningModal } from 'src/components/WarningModal'
import { Namespaces } from 'src/i18n'
import { cancelVerification } from 'src/identity/actions'
import { VerificationStatus } from 'src/identity/types'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { toggleFornoMode } from 'src/web3/actions'

interface Props {
  verificationStatus: VerificationStatus
  retryWithForno: boolean
  fornoMode: boolean
  cancelVerification: typeof cancelVerification
  setRetryVerificationWithForno: typeof setRetryVerificationWithForno
  toggleFornoMode: typeof toggleFornoMode
}

export function VerificationFailedModal(props: Props) {
  const { t } = useTranslation(Namespaces.nuxVerification2)
  const [isDismissed, setIsDismissed] = React.useState(true)

  React.useEffect(() => {
    setIsDismissed(false) // Prevents a ghost modal from showing up briefly
  }, [setIsDismissed]) // after opening Verification Loading when it is already dismissed

  const onDismiss = React.useCallback(() => {
    setIsDismissed(true)
  }, [setIsDismissed])

  const onSkip = React.useCallback(() => {
    props.cancelVerification()
    navigateHome()
  }, [props.cancelVerification])

  const onRetry = React.useCallback(() => {
    props.toggleFornoMode(true) // Note that forno remains toggled on after verification retry
    props.setRetryVerificationWithForno(false) // Only prompt retry with forno once
    setIsDismissed(true)
    navigate(Screens.VerificationEducationScreen)
  }, [setIsDismissed, props.setRetryVerificationWithForno])

  const isVisible =
    (props.verificationStatus === VerificationStatus.Failed ||
      props.verificationStatus === VerificationStatus.RevealAttemptFailed) &&
    !isDismissed

  const allowEnterCodes = props.verificationStatus === VerificationStatus.RevealAttemptFailed
  const promptRetryWithForno = props.retryWithForno && !props.fornoMode // Only prompt forno switch if not already in forno mode

  return promptRetryWithForno ? (
    // Retry verification with forno with option to skip verificaion
    <WarningModal
      isVisible={isVisible}
      header={t('retryWithFornoModal.header')}
      body1={t('retryWithFornoModal.body1')}
      body2={t('retryWithFornoModal.body2')}
      continueTitle={t('retryWithFornoModal.retryButton')}
      cancelTitle={t('education.skip')}
      onCancel={onSkip}
      onContinue={onRetry}
    />
  ) : allowEnterCodes ? (
    // Option to enter codes if reveal attempt failed
    <WarningModal
      isVisible={isVisible}
      header={t('failModal.header')}
      body1={t('failModal.body1')}
      body2={t('failModal.enterCodesBody')}
      continueTitle={t('education.skip')}
      cancelTitle={t('global:goBack')}
      onCancel={onDismiss}
      onContinue={onSkip}
    />
  ) : (
    // Else skip verification
    <WarningModal
      isVisible={isVisible}
      header={t('failModal.header')}
      body1={t('failModal.body1')}
      body2={t('failModal.body2')}
      continueTitle={t('education.skip')}
      onContinue={onSkip}
    />
  )
}
