import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { setBackupDelayed } from 'src/account/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces } from 'src/i18n'
import { navigateBack } from 'src/navigator/NavigationService'
import TopBarButton from 'src/navigator/TopBarButton.v2'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'

interface DelayStateProps {
  backupTooLate: boolean
  backupDelayedTime: number
}

const mapStateToHeaderProps = (state: RootState): DelayStateProps => {
  return {
    backupTooLate: isBackupTooLate(state),
    backupDelayedTime: state.account.backupDelayedTime,
  }
}

export default function DelayButton() {
  const { backupTooLate, backupDelayedTime } = useSelector(mapStateToHeaderProps)
  const dispatch = useDispatch()

  const onPressDelay = React.useCallback(() => {
    dispatch(setBackupDelayed())
    CeloAnalytics.track(CustomEventNames.delay_backup)
    navigateBack()
  }, [dispatch])

  const { t } = useTranslation(Namespaces.backupKeyFlow6)

  if (backupTooLate && !backupDelayedTime) {
    return (
      <TopBarButton style={styles.root} onPress={onPressDelay}>
        {t('delayBackup')}
      </TopBarButton>
    )
  } else {
    return <View />
  }
}

const styles = StyleSheet.create({
  root: {
    color: colors.gray4,
  },
})
