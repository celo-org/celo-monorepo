import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import { exitBackupFlow } from 'src/app/actions'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  backupCompleted: boolean
  socialBackupCompleted: boolean
}

interface DispatchProps {
  exitBackupFlow: typeof exitBackupFlow
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
    socialBackupCompleted: state.account.socialBackupCompleted,
  }
}

class BackupComplete extends React.Component<Props> {
  static navigationOptions = { header: null }

  componentDidMount() {
    // Show success text for a while before leaving screen
    const { backupCompleted, socialBackupCompleted } = this.props
    setTimeout(() => {
      if (socialBackupCompleted) {
        this.props.exitBackupFlow()
        navigateHome()
      } else if (backupCompleted) {
        navigate(Screens.BackupIntroduction)
      } else {
        throw new Error('Backup complete screen should not be reachable without completing backup')
      }
    }, 2000)
  }

  render() {
    const { t, backupCompleted, socialBackupCompleted } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.innerContainer}>
          <NuxLogo height={70} />
          {backupCompleted &&
            !socialBackupCompleted && (
              <>
                <Text style={styles.h1}>{t('backupComplete.0')}</Text>
                <Text style={styles.h2}>{t('backupComplete.1')}</Text>
              </>
            )}
          {backupCompleted &&
            socialBackupCompleted && <Text style={styles.h1}>{t('backupComplete.2')}</Text>}
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
    paddingHorizontal: 40,
  },
  h2: {
    ...fontStyles.h2,
    paddingHorizontal: 40,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      exitBackupFlow,
    }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupComplete))
)
