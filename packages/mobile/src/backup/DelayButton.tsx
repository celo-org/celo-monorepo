import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { setBackupDelayed } from 'src/account/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Namespaces } from 'src/i18n'
import { navigateHome } from 'src/navigator/NavigationService'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import useTypedSelector from 'src/redux/useSelector'

export default function DelayButton() {
  const shouldShowDelayButton = useTypedSelector(
    (state) => !state.account.backupRequiredTime && !state.account.backupCompleted
  )
  const dispatch = useDispatch()

  const onPressDelay = React.useCallback(() => {
    dispatch(setBackupDelayed())
    ValoraAnalytics.track(OnboardingEvents.backup_delay)
    navigateHome()
  }, [dispatch])

  const { t } = useTranslation(Namespaces.backupKeyFlow6)

  if (!shouldShowDelayButton) {
    return null
  }
  return <TopBarTextButton onPress={onPressDelay} title={t('delayBackup')} />
}
