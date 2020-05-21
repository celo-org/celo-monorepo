import colorsV2 from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import CancelButton from 'src/components/CancelButton.v2'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'
import { navigateHome } from 'src/navigator/NavigationService'

interface Props {
  screen: string
}

export default function CancelConfirm({ screen }: Props) {
  const [isOpen, setOpenState] = React.useState(true)
  const { t } = useTranslation(Namespaces.backupKeyFlow6)

  const actionText = t('cancelDialogAction')
  const secondaryText = t('cancelDialogSecondary')

  const onCancel = React.useCallback(() => {
    setOpenState(true)
    CeloAnalytics.track(CustomEventNames.backup_cancel, { screen })
  }, [screen])

  const onComplete = React.useCallback(() => {
    setOpenState(false)
    CeloAnalytics.track(CustomEventNames.backup_cancel_procrastinate, { screen, title: actionText })
  }, [screen, actionText])

  const onProcrastinate = React.useCallback(() => {
    setOpenState(false)
    navigateHome()
    CeloAnalytics.track(CustomEventNames.backup_cancel_procrastinate, {
      screen,
      title: secondaryText,
    })
  }, [screen, secondaryText])

  return (
    <>
      <Dialog
        title={t('cancelDialogTitle')}
        isVisible={isOpen}
        actionText={actionText}
        actionPress={onComplete}
        secondaryActionPress={onProcrastinate}
        secondaryActionText={secondaryText}
      >
        {t('cancelDialogBody')}
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
