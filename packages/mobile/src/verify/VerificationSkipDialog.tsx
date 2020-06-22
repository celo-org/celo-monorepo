import * as React from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'

interface Props {
  isVisible: boolean
  onPressCancel: () => void
  onPressConfirm: () => void
}

export default function VerificationSkipDialog({
  isVisible,
  onPressCancel,
  onPressConfirm,
}: Props) {
  const { t } = useTranslation(Namespaces.onboarding)
  return (
    <Dialog
      title={t('verificationSkipDialog.title')}
      isVisible={isVisible}
      actionText={t('verificationSkipDialog.confirm')}
      actionPress={onPressConfirm}
      secondaryActionPress={onPressCancel}
      secondaryActionText={t('verificationSkipDialog.cancel')}
      testID="VerificationSkipDialog"
    >
      {t('verificationSkipDialog.body')}
    </Dialog>
  )
}
