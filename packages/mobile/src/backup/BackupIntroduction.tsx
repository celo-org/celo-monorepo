import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import CancelButton from 'src/components/CancelButton'
import { Namespaces } from 'src/i18n'
import backupIcon from 'src/images/backup-icon.png'

type Props = {
  backupCompleted: boolean
  socialBackupCompleted: boolean
  backupDelayedTime: number
  backupTooLate: boolean
  onBackup: () => void
  onSocialBackup: () => void
  onCancel: () => void
  onDelay: () => void
} & WithNamespaces

interface State {
  visibleModal: boolean
}

class BackupIntroduction extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state = {
    visibleModal: false,
  }

  cancel = () => {
    CeloAnalytics.track(CustomEventNames.backup_cancel)
    this.props.onCancel()
  }

  onSkip = () => {
    this.setState({ visibleModal: true })
    CeloAnalytics.track(CustomEventNames.skip_backup)
  }

  onViewBackupKey = () => {
    CeloAnalytics.track(CustomEventNames.view_backup_phrase)
    this.props.onBackup()
  }

  onViewSocialBackup = () => {
    CeloAnalytics.track(CustomEventNames.view_social_backup)
    this.props.onSocialBackup()
  }

  onBackup = () => {
    CeloAnalytics.track(CustomEventNames.set_backup_phrase)
    this.props.onBackup()
  }

  onSocialBackup = () => {
    CeloAnalytics.track(CustomEventNames.set_social_backup)
    this.props.onSocialBackup()
  }

  onDelay = () => {
    CeloAnalytics.track(CustomEventNames.delay_backup)
    this.props.onDelay()
  }

  onInsistSkip = () => {
    CeloAnalytics.track(CustomEventNames.insist_skip_backup)
    this.props.onCancel()
  }

  onInsistBackup = () => {
    CeloAnalytics.track(CustomEventNames.insist_backup_phrase)
    this.props.onBackup()
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
        <View style={componentStyles.topBar}>
          <CancelButton onCancel={this.props.onCancel} />
        </View>
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

export default componentWithAnalytics(withNamespaces(Namespaces.backupKeyFlow6)(BackupIntroduction))
