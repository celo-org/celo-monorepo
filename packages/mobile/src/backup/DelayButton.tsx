import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
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
interface DelayDispatchProps {
  setBackupAsDelayed: typeof setBackupDelayed
}

const mapStateToHeaderProps = (state: RootState): DelayStateProps => {
  return {
    backupTooLate: isBackupTooLate(state),
    backupDelayedTime: state.account.backupDelayedTime,
  }
}

const dispatchToProps = {
  setBackupAsDelayed: setBackupDelayed,
}

export default connect<DelayStateProps, DelayDispatchProps, {}, RootState>(
  mapStateToHeaderProps,
  dispatchToProps
)(function DelayButton(props: DelayDispatchProps & DelayStateProps) {
  const { backupTooLate, backupDelayedTime, setBackupAsDelayed } = props

  const onPressDelay = React.useCallback(() => {
    setBackupAsDelayed()
    CeloAnalytics.track(CustomEventNames.delay_backup)
    navigateBack()
  }, [])

  const { t } = useTranslation(Namespaces.accountKeyFlow)

  if (backupTooLate && !backupDelayedTime) {
    return (
      <TopBarButton style={styles.root} onPress={onPressDelay}>
        {t('delayBackup')}
      </TopBarButton>
    )
  } else {
    return <View />
  }
})

const styles = StyleSheet.create({
  root: {
    color: colors.gray4,
  },
})
