import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'
import { connect } from 'react-redux'
import { setBackupDelayed } from 'src/account/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { enterBackupFlow } from 'src/app/actions'
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
    this.goBack(CustomEventNames.insist_skip_backup)
  }

  onInsistBackup = () => {
    this.goBackup(CustomEventNames.insist_backup_phrase)
  }

  skip = () => {
    const { t } = this.props
    return (
      <View style={styles.modalContent}>
        <Text style={[fontStyles.bold, styles.modalTitleText]}>{t('areYouSure')}</Text>
        <Text style={styles.modalContentText}>
          {t('backupSkipText.0')}
          <Text style={fontStyles.bold}>{t('backupSkipText.1')}</Text>
        </Text>
        <View style={styles.modalOptionsContainer}>
          <TouchableOpacity onPress={this.onInsistSkip}>
            <Text style={[styles.modalOptions, fontStyles.semiBold]}>{t('skip')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.onInsistBackup}>
            <Text style={[styles.modalOptions, fontStyles.semiBold, { color: colors.celoGreen }]}>
              {t('getBackupKey')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
          <Text style={[fontStyles.body, styles.body]}>{t('backupKeyImportance.0')}</Text>
          <Text style={[fontStyles.body, styles.body]}>{t('backupKeyImportance.1')}</Text>
          <Text style={[fontStyles.body, styles.body]}>{t('backupKeyImportance.2')}</Text>
        </ScrollView>
        <View>
          <View style={styles.modalContainer}>
            <Modal isVisible={this.state.visibleModal === true}>{this.skip()}</Modal>
          </View>
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
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: variables.width - 200,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
  },
  modalOptionsContainer: {
    paddingVertical: 20,
    marginLeft: 40,
    justifyContent: 'space-around',
    flexDirection: 'row',
  },
  modalTitleText: {
    marginTop: 22,
    marginBottom: 20,
    color: colors.dark,
    fontSize: 18,
    paddingHorizontal: 30,
  },
  modalContentText: {
    marginBottom: 10,
    color: colors.darkSecondary,
    fontSize: 14,
    paddingHorizontal: 30,
  },
  modalOptions: {
    fontSize: 14,
    color: colors.dark,
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
