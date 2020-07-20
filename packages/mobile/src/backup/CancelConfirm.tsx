import colorsV2 from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CancelButton from 'src/components/CancelButton.v2'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'
import { navigateHome } from 'src/navigator/NavigationService'

interface Props {
  screen: string
}

export default function CancelConfirm({ screen }: Props) {
  const [isOpen, setOpenState] = React.useState(false)
  const { t } = useTranslation(Namespaces.backupKeyFlow6)

  const actionText = t('cancelDialog.action')
  const secondaryText = t('cancelDialog.secondary')

  const onCancel = React.useCallback(() => {
    setOpenState(true)
    ValoraAnalytics.track(OnboardingEvents.backup_cancel)
  }, [screen])

  const onComplete = React.useCallback(() => {
    setOpenState(false)
    ValoraAnalytics.track(OnboardingEvents.backup_delay_cancel)
  }, [screen, actionText])

  const onProcrastinate = React.useCallback(() => {
    setOpenState(false)
    navigateHome()
    ValoraAnalytics.track(OnboardingEvents.backup_delay_confirm)
  }, [screen, secondaryText])

  return (
    <>
      <Dialog
        title={t('cancelDialog.title')}
        isVisible={isOpen}
        actionText={actionText}
        actionPress={onComplete}
        secondaryActionPress={onProcrastinate}
        secondaryActionText={secondaryText}
      >
        {t('cancelDialog.body')}
      </Dialog>
      <CancelButton onCancel={onCancel} style={styles.button} />
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    color: colorsV2.gray4,
  },
})
