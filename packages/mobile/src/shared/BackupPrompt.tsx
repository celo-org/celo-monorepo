import SmartTopAlert, { NotificationTypes } from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'

interface StateProps {
  backupCompleted: boolean
  accountCreationTime: number
  doingBackupFlow: boolean
  backupTooLate: boolean
}

type Props = WithTranslation & StateProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    accountCreationTime: state.account.accountCreationTime,
    backupCompleted: state.account.backupCompleted,
    doingBackupFlow: state.app.doingBackupFlow,
    backupTooLate: isBackupTooLate(state),
  }
}

export class BackupPrompt extends React.Component<Props> {
  goToBackup = () => {
    navigate(Screens.BackupIntroduction)
  }

  render() {
    const { t } = this.props

    const isVisible =
      this.props.backupTooLate && !this.props.doingBackupFlow && !this.props.backupCompleted

    return (
      <SmartTopAlert
        isVisible={isVisible}
        timestamp={Date.now()}
        text={isVisible ? t('backupPrompt') : null}
        onPress={this.goToBackup}
        type={NotificationTypes.MESSAGE}
        buttonMessage={isVisible ? t('getBackupKey') : null}
      />
    )
  }
}

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withTranslation(Namespaces.backupKeyFlow6)(BackupPrompt)
)
