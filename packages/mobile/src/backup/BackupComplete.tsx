import Checkmark from '@celo/react-components/icons/Checkmark'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  backupCompleted: boolean
}

type Props = StateProps & WithTranslation & StackScreenProps<StackParamList, Screens.BackupComplete>

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
  }
}

class BackupComplete extends React.Component<Props> {
  static navigationOptions = { header: null }

  componentDidMount() {
    // Show success check for a while before leaving screen
    const { backupCompleted } = this.props
    setTimeout(() => {
      const navigatedFromSettings = this.props.route.params?.navigatedFromSettings ?? false
      if (navigatedFromSettings) {
        navigate(Screens.Settings, { promptConfirmRemovalModal: true })
      } else if (backupCompleted) {
        ValoraAnalytics.track(OnboardingEvents.backup_complete)
        navigate(Screens.BackupIntroduction)
      } else {
        throw new Error('Backup complete screen should not be reachable without completing backup')
      }
    }, 2000)
  }

  render() {
    const { t, backupCompleted } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.innerContainer}>
          {backupCompleted && <Checkmark height={32} />}
          {backupCompleted && <Text style={styles.h1}>{t('backupComplete.2')}</Text>}
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
})

export default connect<StateProps, {}, {}, RootState>(
  mapStateToProps,
  {}
)(withTranslation<Props>(Namespaces.backupKeyFlow6)(BackupComplete))
