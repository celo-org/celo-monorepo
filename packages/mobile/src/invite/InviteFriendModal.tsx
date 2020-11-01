import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { toggleInviteModal } from 'src/app/actions'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'
import { inviteModal } from 'src/images/Images'
import Logger from 'src/utils/Logger'

interface Props {
  isVisible: boolean
  onInvite: () => void
  onCancel?: () => void
}

const InviteFriendModal = ({ isVisible, onInvite, onCancel }: Props) => {
  const { t } = useTranslation(Namespaces.inviteFlow11)
  const dispatch = useDispatch()

  const onPressInvite = async () => {
    try {
      await onInvite()
    } catch (error) {
      Logger.error('Failed to invite:', error)
    }
    closeModal()
  }

  const closeModal = () => {
    onCancel?.()
    dispatch(toggleInviteModal(null))
  }

  return (
    <Dialog
      title={t('inviteDialog.title')}
      isVisible={isVisible}
      actionText={t('inviteDialog.button')}
      actionPress={onPressInvite}
      secondaryActionText={t('global:cancel')}
      secondaryActionPress={closeModal}
      image={inviteModal}
    >
      {t('inviteDialog.body')}
    </Dialog>
  )
}

export default InviteFriendModal
