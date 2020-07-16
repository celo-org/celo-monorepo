import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
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
}

export function VerificationFailedModal({ verificationStatus, retryWithForno, fornoMode }: Props) {
  const dispatch = useDispatch()
  const { t } = useTranslation(Namespaces.nuxVerification2)
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    setIsDismissed(false) // Prevents a ghost modal from showing up briefly
  }, []) // after opening Verification Loading when it is already dismissed

  const onDismiss = () => {
    setIsDismissed(true)
  }

  const onSkip = () => {
    dispatch(cancelVerification())
    navigateHome()
  }

  const onRetry = () => {
    dispatch(toggleFornoMode(true)) // Note that forno remains toggled on after verification retry
    dispatch(setRetryVerificationWithForno(false)) // Only prompt retry with forno once
    setIsDismissed(true)
    navigate(Screens.VerificationEducationScreen)
  }

  const userBalanceInsufficient = verificationStatus === VerificationStatus.InsufficientBalance

  const isVisible =
    (verificationStatus === VerificationStatus.Failed ||
      verificationStatus === VerificationStatus.RevealAttemptFailed ||
      userBalanceInsufficient) &&
    !isDismissed

  const allowEnterCodes = verificationStatus === VerificationStatus.RevealAttemptFailed
  // Only prompt forno switch if not already in forno mode and failure
  // wasn't due to insuffuicient balance
  const promptRetryWithForno =
    retryWithForno && !fornoMode && verificationStatus !== VerificationStatus.InsufficientBalance

  return promptRetryWithForno ? (
    // Retry verification with forno with option to skip verification
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
      body1={
        userBalanceInsufficient ? t('failModal.body1InsufficientBalance') : t('failModal.body1')
      }
      body2={
        userBalanceInsufficient ? t('failModal.body2InsufficientBalance') : t('failModal.body2')
      }
      continueTitle={t('education.skip')}
      onContinue={onSkip}
    />
  )
}
