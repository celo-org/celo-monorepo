import React from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'
import { inviteModal } from 'src/images/Images'

interface Props {
  isVisible: boolean
  name: string
  onInvite: () => void
  onCancel?: () => void
}

export default function InviteAndSendModal({ isVisible, name, onInvite, onCancel }: Props) {
  const { t } = useTranslation(Namespaces.inviteFlow11)

  return (
    <Dialog
      title={t('inviteAndSendDialog.title')}
      isVisible={isVisible}
      actionText={t('inviteAndSendDialog.button')}
      actionPress={onInvite}
      secondaryActionText={t('global:cancel')}
      secondaryActionPress={onCancel}
      image={inviteModal}
      testID="InviteAndSendModal"
    >
      {t('inviteAndSendDialog.body', { name })}
    </Dialog>
  )
}
