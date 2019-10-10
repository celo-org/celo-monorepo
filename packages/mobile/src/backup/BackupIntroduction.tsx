import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { setBackupDelayed } from 'src/account/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { enterBackupFlow, exitBackupFlow } from 'src/app/actions'
import { Namespaces } from 'src/i18n'
import backupIcon from 'src/images/backup-icon.png'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'

interface State {
  visibleModal: boolean
}

interface StateProps {
  language: string | null
  backupCompleted: boolean
  socialBackupCompleted: boolean
  backupTooLate: boolean
  backupDelayedTime: number
}

interface DispatchProps {
  setBackupDelayed: typeof setBackupDelayed
  enterBackupFlow: typeof enterBackupFlow
  exitBackupFlow: typeof exitBackupFlow
}

type Props = WithNamespaces & StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    language: state.app.language,
    backupCompleted: state.account.backupCompleted,
    socialBackupCompleted: state.account.socialBackupCompleted,
    backupTooLate: isBackupTooLate(state),
    backupDelayedTime: state.account.backupDelayedTime,
  }
}

class BackupIntroduction extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  state = {
    visibleModal: false,
  }

  componentDidMount() {
    this.props.enterBackupFlow()
  }

  componentWillUnmount() {
    this.props.exitBackupFlow()
  }

  trackAnalytics = (event?: CustomEventNames) => {
    if (!event) {
      return
    }

    CeloAnalytics.track(CustomEventNames.backup_cancel)
  }

  // goSocialBackup = (event?: CustomEventNames) => {
  // }
  // onPressSkip = () => {
  //   this.setState({ visibleModal: true })
  //   this.trackAnalytics(CustomEventNames.skip_backup)
  // }

  onPressViewBackupKey = () => {
    this.trackAnalytics(CustomEventNames.view_backup_phrase)
    navigate(Screens.BackupPhrase)
  }

  onPressBackup = () => {
    this.trackAnalytics(CustomEventNames.set_backup_phrase)
    navigate(Screens.BackupPhrase)
  }

  onPressSetupSocialBackup = () => {
    this.trackAnalytics(CustomEventNames.set_social_backup)
    navigate(Screens.BackupSocial)
  }

  // onPressViewSocialBackup = () => {
  //   this.goSocialBackup(CustomEventNames.view_social_backup)
  // }

  onPressDelay = () => {
    this.props.setBackupDelayed()
    this.trackAnalytics(CustomEventNames.delay_backup)
    navigateBack()
  }

  // onInsistSkip = () => {
  //   this.setState({ visibleModal: false }, () => this.goBack(CustomEventNames.insist_skip_backup))
  // }

  // onInsistBackup = () => {
  //   this.setState({ visibleModal: false }, () =>
  //     this.goBackup(CustomEventNames.insist_backup_phrase)
  //   )
  // }

  render() {
    const {
      t,
      backupDelayedTime,
      backupTooLate,
      backupCompleted,
      socialBackupCompleted,
    } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Image source={backupIcon} style={styles.logo} />
          <Text style={styles.h1}>{t('backupAndRecovery')}</Text>
          <Text style={styles.body}>{t('backupKeyImportance.0')}</Text>
          <Text style={[styles.body, fontStyles.bold]}>{t('backupKeyImportance.1')}</Text>
          {!backupCompleted && (
            <>
              <Text style={styles.body}>{t('toKeepSafe')}</Text>
              <Text style={styles.bodyCta}>{t('writeDownKey')}</Text>
              <Text style={styles.bodyCta}>{t('shareSocialBackup')}</Text>
            </>
          )}
        </ScrollView>
        <View>
          {/* <BackupModal
            title={t('areYouSure')}
            isVisible={this.state.visibleModal}
            buttonText0={t('skip')}
            onPress0={this.onInsistSkip}
            buttonText1={t('getBackupKey')}
            onPress1={this.onInsistBackup}
          >
            <Text>
              {t('backupSkipText.0')}
              <Text style={fontStyles.bold}>{t('backupSkipText.1')}</Text>
            </Text>
          </BackupModal> */}

          {!backupCompleted && (
            <Button
              onPress={this.onPressBackup}
              text={t('global:getStarted')}
              standard={false}
              type={BtnTypes.PRIMARY}
            />
          )}

          {backupCompleted &&
            !socialBackupCompleted && (
              <>
                <Button
                  onPress={this.onPressSetupSocialBackup}
                  text={t('setUpSocialBackup')}
                  standard={false}
                  type={BtnTypes.PRIMARY}
                />
                <Button
                  onPress={this.onPressViewBackupKey}
                  text={t('viewBackupKey')}
                  standard={false}
                  type={BtnTypes.TERTIARY}
                />
              </>
            )}

          {backupCompleted &&
            socialBackupCompleted && (
              <Button
                onPress={this.onPressBackup}
                text={t('viewBackupKey')}
                standard={false}
                type={BtnTypes.PRIMARY}
              />
            )}

          {backupTooLate &&
            !backupDelayedTime && (
              <Button
                onPress={this.onPressDelay}
                text={t('delayBackup')}
                standard={false}
                type={BtnTypes.TERTIARY}
              />
            )}
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  logo: {
    alignSelf: 'center',
    height: 75,
    width: 75,
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 15,
  },
  body: {
    ...fontStyles.body,
    paddingBottom: 15,
  },
  bodyCta: {
    ...fontStyles.body,
    paddingBottom: 5,
    paddingLeft: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      setBackupDelayed,
      enterBackupFlow,
      exitBackupFlow,
    }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupIntroduction))
)
