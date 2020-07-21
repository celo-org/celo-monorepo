import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { setRetryVerificationWithForno } from 'src/account/actions'
import Dialog from 'src/components/Dialog'
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

  const userBalanceInsufficient =
    props.verificationStatus === VerificationStatus.InsufficientBalance

  const isVisible =
    (props.verificationStatus === VerificationStatus.Failed ||
      props.verificationStatus === VerificationStatus.RevealAttemptFailed ||
      userBalanceInsufficient) &&
    !isDismissed

  const allowEnterCodes = props.verificationStatus === VerificationStatus.RevealAttemptFailed
  // Only prompt forno switch if not already in forno mode and failure
  // wasn't due to insuffuicient balance
  const promptRetryWithForno =
    props.retryWithForno &&
    !props.fornoMode &&
    props.verificationStatus !== VerificationStatus.InsufficientBalance

  return promptRetryWithForno ? (
    // Retry verification with forno with option to skip verificaion
    <Dialog
      isVisible={isVisible}
      title={t('retryWithFornoModal.header')}
      actionText={t('retryWithFornoModal.retryButton')}
      secondaryActionText={t('education.skip')}
      actionPress={onRetry}
      secondaryActionPress={onSkip}
    >
      {t('retryWithFornoModal.body1')}
      {'\n\n'}
      {t('retryWithFornoModal.body2')}
    </Dialog>
  ) : allowEnterCodes ? (
    // Option to enter codes if reveal attempt failed
    <Dialog
      isVisible={isVisible}
      title={t('failModal.header')}
      actionText={t('education.skip')}
      secondaryActionText={t('global:goBack')}
      actionPress={onSkip}
      secondaryActionPress={onDismiss}
    >
      {t('failModal.body1')}
      {'\n\n'}
      {t('failModal.enterCodesBody')}
    </Dialog>
  ) : (
    // Else skip verification
    <Dialog
      isVisible={isVisible}
      title={t('failModal.header')}
      actionPress={onSkip}
      actionText={t('education.skip')}
      secondaryActionDisabled={true}
    >
      {userBalanceInsufficient ? t('failModal.body1InsufficientBalance') : t('failModal.body1')}
      {'\n\n'}
      {userBalanceInsufficient ? t('failModal.body2InsufficientBalance') : t('failModal.body2')}
    </Dialog>
  )
}
