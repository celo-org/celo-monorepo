import SmallButton from '@celo/react-components/components/SmallButton'
import TopAlert from '@celo/react-components/components/TopAlert'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
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

    return (
      <TopAlert
        height={93}
        backgroundColor={colors.messageBlue}
        visible={this.isVisible()}
        style={styles.container}
      >
        <Text style={[fontStyles.bodySmall, styles.text]}>{t('backupPrompt')}</Text>
        <SmallButton
          onPress={this.goToBackup}
          text={t('getBackupKey')}
          solid={false}
          style={styles.button}
          textStyle={styles.buttonText}
        />
      </TopAlert>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    borderColor: colors.white,
    alignSelf: 'center',
  },
  buttonText: {
    color: colors.white,
  },
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withNamespaces(Namespaces.backupKeyFlow6)(BackupPrompt)
)
