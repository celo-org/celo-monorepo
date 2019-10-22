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

interface StateProps {
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
    backupCompleted: state.account.backupCompleted,
    socialBackupCompleted: state.account.socialBackupCompleted,
    backupTooLate: isBackupTooLate(state),
    backupDelayedTime: state.account.backupDelayedTime,
  }
}

class BackupIntroduction extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  componentDidMount() {
    this.props.enterBackupFlow()
  }

  componentWillUnmount() {
    this.props.exitBackupFlow()
  }

  onPressViewBackupKey = () => {
    CeloAnalytics.track(CustomEventNames.view_backup_phrase)
    navigate(Screens.BackupPhrase)
  }

  onPressBackup = () => {
    CeloAnalytics.track(CustomEventNames.set_backup_phrase)
    navigate(Screens.BackupPhrase)
  }

  onPressSetupSocialBackup = () => {
    CeloAnalytics.track(CustomEventNames.set_social_backup)
    navigate(Screens.BackupSocialIntro)
  }

  onPressViewSocialBackup = () => {
    CeloAnalytics.track(CustomEventNames.view_social_backup)
    navigate(Screens.BackupSocial)
  }

  onPressDelay = () => {
    this.props.setBackupDelayed()
    CeloAnalytics.track(CustomEventNames.delay_backup)
    navigateBack()
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
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Image source={backupIcon} style={styles.logo} />
          <Text style={styles.h1}>{t('backupAndRecovery')}</Text>
          {!backupCompleted && (
            <>
              <Text style={styles.body}>{t('backupKeyIntro.0')}</Text>
              <Text style={[styles.body, fontStyles.bold]}>{t('backupKeyIntro.1')}</Text>
            </>
          )}
          {backupCompleted &&
            !socialBackupCompleted && (
              <>
                <Text style={styles.body}>
                  {t('backupKeyIntro.2')}
                  <Text style={[styles.body, fontStyles.bold]}>{t('backupKeyIntro.3')}</Text>
                </Text>
                <Text style={styles.body}>{t('backupKeyIntro.4')}</Text>
              </>
            )}
          {backupCompleted &&
            socialBackupCompleted && (
              <>
                <Text style={styles.body}>
                  {t('backupKeyIntro.2')}
                  <Text style={[styles.body, fontStyles.bold]}>{t('backupKeyIntro.3')}</Text>
                </Text>
                <Text style={styles.body}>
                  {t('backupKeyIntro.5')}
                  <Text style={[styles.body, fontStyles.bold]}>{t('backupKeyIntro.6')}</Text>
                </Text>
              </>
            )}
        </ScrollView>
        <View>
          {!backupCompleted && (
            <>
              <Button
                onPress={this.onPressBackup}
                text={t('getYourKey')}
                standard={false}
                type={BtnTypes.PRIMARY}
              />
              {backupTooLate &&
                !backupDelayedTime && (
                  <Button
                    onPress={this.onPressDelay}
                    text={t('delayBackup')}
                    standard={false}
                    type={BtnTypes.SECONDARY}
                  />
                )}
            </>
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
                  type={BtnTypes.SECONDARY}
                />
              </>
            )}

          {backupCompleted &&
            socialBackupCompleted && (
              <>
                <Button
                  onPress={this.onPressBackup}
                  text={t('viewBackupKey')}
                  standard={false}
                  type={BtnTypes.SECONDARY}
                />
                <Button
                  onPress={this.onPressViewSocialBackup}
                  text={t('viewSafeguards')}
                  standard={false}
                  type={BtnTypes.SECONDARY}
                />
              </>
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
    paddingHorizontal: 30,
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
    textAlign: 'center',
    paddingBottom: 15,
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
