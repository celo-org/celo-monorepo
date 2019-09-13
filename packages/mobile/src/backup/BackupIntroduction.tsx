import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { setBackupDelayed } from 'src/account/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { enterBackupFlow } from 'src/app/actions'
import BackupModal from 'src/backup/BackupModal'
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

  trackAnalytics = (event?: CustomEventNames) => {
    if (!event) {
      return
    }

    CeloAnalytics.track(CustomEventNames.backup_cancel)
  }

  goBackup = (event?: CustomEventNames) => {
    this.trackAnalytics(event)
    navigate(Screens.BackupPhrase)
  }

  goSocialBackup = (event?: CustomEventNames) => {
    this.trackAnalytics(event)
    navigate(Screens.BackupSocialFirst)
  }

  goBack = (event?: CustomEventNames) => {
    this.trackAnalytics(event)
    navigateBack()
  }

  cancel = () => {
    this.goBack(CustomEventNames.backup_cancel)
  }

  onSkip = () => {
    this.setState({ visibleModal: true })
    this.trackAnalytics(CustomEventNames.skip_backup)
  }

  onViewBackupKey = () => {
    this.goBackup(CustomEventNames.view_backup_phrase)
  }

  onBackup = () => {
    this.goBackup(CustomEventNames.set_backup_phrase)
  }

  onSocialBackup = () => {
    this.goSocialBackup(CustomEventNames.set_social_backup)
  }

  onViewSocialBackup = () => {
    this.goSocialBackup(CustomEventNames.view_social_backup)
  }

  onDelay = () => {
    this.props.setBackupDelayed()
    this.goBack(CustomEventNames.delay_backup)
  }

  onInsistSkip = () => {
    this.setState({ visibleModal: false }, () => this.goBack(CustomEventNames.insist_skip_backup))
  }

  onInsistBackup = () => {
    this.setState({ visibleModal: false }, () =>
      this.goBackup(CustomEventNames.insist_backup_phrase)
    )
  }

  render() {
    const {
      t,
      backupDelayedTime,
      backupTooLate,
      backupCompleted,
      socialBackupCompleted,
    } = this.props
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.center}>
            <Image source={backupIcon} style={styles.logo} />
          </View>
          <Text style={[fontStyles.h1, styles.h1]}>{t('backupKey')}</Text>
          <Text style={[fontStyles.body, styles.body]}>
            {t('backupKeyImportance.0')}
            <Text style={[fontStyles.bold]}>{t('backupKeyImportance.1')}</Text>
          </Text>
          {!backupCompleted || !socialBackupCompleted ? (
            <Text style={[fontStyles.body, styles.body]}>{t('toDo')}</Text>
          ) : (
            <Text style={[fontStyles.body, styles.body]}>{t('allDone')}</Text>
          )}
          {!backupCompleted && (
            <Text style={[fontStyles.body, styles.body]}>{t('writeDownKey')}</Text>
          )}
          {!socialBackupCompleted && (
            <Text style={[fontStyles.body, styles.body]}>{t('shareSocialBackup')}</Text>
          )}
        </ScrollView>
        <View>
          <BackupModal
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
          </BackupModal>
          {backupCompleted &&
            !socialBackupCompleted && (
              <Button
                onPress={this.onSocialBackup}
                text={t('setUpSocialBackup')}
                standard={false}
                type={BtnTypes.PRIMARY}
              />
            )}

          {!backupCompleted ? (
            <Button
              onPress={this.onBackup}
              text={t('getBackupKey')}
              standard={false}
              type={BtnTypes.PRIMARY}
            />
          ) : (
            <Button
              onPress={this.onViewBackupKey}
              text={t('viewBackupKey')}
              standard={false}
              type={BtnTypes.TERTIARY}
            />
          )}

          {socialBackupCompleted && (
            <Button
              onPress={this.onViewSocialBackup}
              text={t('viewSocialBackup')}
              standard={false}
              type={BtnTypes.TERTIARY}
            />
          )}

          {backupTooLate &&
            !backupDelayedTime && (
              <Button
                onPress={this.onDelay}
                style={styles.skipLink}
                text={t('delayBackup')}
                standard={false}
                type={BtnTypes.TERTIARY}
              />
            )}

          {!backupTooLate &&
            !backupCompleted && (
              <Button
                onPress={this.onSkip}
                style={styles.skipLink}
                text={t('skip')}
                standard={false}
                type={BtnTypes.TERTIARY}
              />
            )}
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
  },
  logo: {
    height: 75,
    width: 75,
    padding: 10,
  },
  h1: {
    marginTop: 15,
    color: colors.dark,
    textAlign: 'center',
  },
  body: {
    paddingBottom: 15,
  },
  skipLink: {
    textAlign: 'center',
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      setBackupDelayed,
      enterBackupFlow,
    }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupIntroduction))
)
