import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
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
}

export function VerificationFailedModal({ verificationStatus, retryWithForno, fornoMode }: Props) {
  const dispatch = useDispatch()
  const { t } = useTranslation(Namespaces.nuxVerification2)
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    setIsDismissed(false) // Prevents a ghost modal from showing up briefly
  }, []) // after opening Verification Loading when it is already dismissed

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
  const saltQuotaExceeded = verificationStatus === VerificationStatus.SaltQuotaExceeded

  const isVisible =
    (verificationStatus === VerificationStatus.Failed ||
      userBalanceInsufficient ||
      saltQuotaExceeded) &&
    !isDismissed

  // Only prompt forno switch if not already in forno mode and failure
  // wasn't due to insuffuicient balance or exceeded quota for lookups
  const promptRetryWithForno =
    retryWithForno && !fornoMode && !userBalanceInsufficient && !saltQuotaExceeded

  if (promptRetryWithForno) {
    // Retry verification with forno with option to skip verificaion
    return (
      <Dialog
        isVisible={isVisible}
        title={t('retryWithFornoModal.header')}
        actionText={t('retryWithFornoModal.retryButton')}
        actionPress={onRetry}
        secondaryActionText={t('education.skip')}
        secondaryActionPress={onSkip}
      >
        {t('retryWithFornoModal.body1')}
        {'\n\n'}
        {t('retryWithFornoModal.body2')}
      </Dialog>
    )
  } else if (userBalanceInsufficient) {
    // Show userBalanceInsufficient message and skip verification
    return (
      <Dialog
        isVisible={isVisible}
        title={t('failModal.header')}
        actionText={t('education.skip')}
        actionPress={onSkip}
      >
        {t('failModal.body1InsufficientBalance')}
        {'\n\n'}
        {t('failModal.body2InsufficientBalance')}
      </Dialog>
    )
  } else if (saltQuotaExceeded) {
    // Show saltQuotaExceeded message and skip verification
    return (
      <Dialog
        isVisible={isVisible}
        title={t('failModal.header')}
        actionText={t('education.skip')}
        actionPress={onSkip}
      >
        {t('failModal.body1SaltQuotaExceeded')}
        {'\n\n'}
        {t('failModal.body2SaltQuotaExceeded')}
      </Dialog>
    )
  } else {
    return (
      // Show general error and skip verification
      <Dialog
        isVisible={isVisible}
        title={t('failModal.header')}
        actionText={t('education.skip')}
        actionPress={onSkip}
      >
        {t('failModal.body1')}
        {'\n\n'}
        {t('failModal.body2')}
      </Dialog>
    )
  }
}
