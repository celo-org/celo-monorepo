import SmartTopAlert, { NotificationTypes } from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { connect } from 'react-redux'
import { Namespaces } from 'src/i18n'
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

type Props = WithNamespaces & StateProps

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
    navigate(Screens.Backup)
  }

  isVisible = () => {
    return this.props.backupTooLate && !this.props.doingBackupFlow && !this.props.backupCompleted
  }

  render() {
    const { t } = this.props

    const isVisible = this.isVisible()

    return (
      <SmartTopAlert
        text={isVisible && t('backupPrompt')}
        onPress={this.goToBackup}
        type={NotificationTypes.MESSAGE}
        buttonMessage={isVisible && t('getBackupKey')}
      />
    )
  }
}

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withNamespaces(Namespaces.backupKeyFlow6)(BackupPrompt)
)
