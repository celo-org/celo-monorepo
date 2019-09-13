import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import BackupModal from 'src/backup/BackupModal'
import { Namespaces } from 'src/i18n'
import { formatBackupPhraseOnEdit, formatBackupPhraseOnSubmit } from 'src/import/ImportWallet'
import Logger from 'src/utils/Logger'

const TAG = 'Backup/BackupVerify'

type Props = {
  mnemonic: string
  showBackupPhrase: () => void
  onCancel: () => void
  onWrongSubmit: () => void
  onSuccess: () => void
} & WithNamespaces

interface State {
  visibleModal: boolean
  pastedMnemonic: string
}

export class BackupVerify extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state = {
    visibleModal: false,
    pastedMnemonic: '',
  }

  eventNames: { [key: string]: CustomEventNames } = {
    paste: CustomEventNames.backup_paste,
    cancel: CustomEventNames.backup_paste_cancel,
    submit: CustomEventNames.backup_paste_submit,
    incorrect: CustomEventNames.backup_paste_incorrect,
  }

  trackAnalytics = (name: string, data: object = {}) => {
    if (this.eventNames.hasOwnProperty(name)) {
      CeloAnalytics.track(this.eventNames[name], data)
    } else {
      Logger.error(TAG, `Unexpected case for tracking Backup Verify ${name}`)
    }
  }

  onEndEditing = () => {
    this.trackAnalytics('paste')
  }

  setBackupPhrase = (input: string) => {
    this.setState({
      pastedMnemonic: formatBackupPhraseOnEdit(input),
    })
  }

  onWrongSubmit = () => {
    this.trackAnalytics('incorrect')
    this.props.onWrongSubmit()
  }

  onSubmit = () => {
    const { pastedMnemonic } = this.state
    const formattedPhrase = formatBackupPhraseOnSubmit(pastedMnemonic)

    if (this.props.mnemonic === formattedPhrase) {
      this.trackAnalytics('submit', { isCorrect: true })
      this.props.onSuccess()
    } else {
      this.setState({ visibleModal: true })
      this.trackAnalytics('submit', { isCorrect: false })
    }
  }

  render() {
    const { t } = this.props
    const { pastedMnemonic } = this.state

    return (
      <View style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="always">
          <View style={styles.questionTextContainer}>
            <Text style={[fontStyles.body, styles.question]}>
              {t('verifying', { count: 2, total: 2 })}
            </Text>
            <Text style={[fontStyles.h1]}>{t('enterBackupKey')}</Text>
            <Text style={[fontStyles.body, styles.body]}>{t('backupKeyConfirmation')}</Text>
            <View style={[componentStyles.row, styles.backupInput]}>
              <TextInput
                onChangeText={this.setBackupPhrase}
                onEndEditing={this.onEndEditing}
                value={pastedMnemonic}
                style={componentStyles.input}
                underlineColorAndroid="transparent"
                placeholder={t('backupKey')}
                placeholderTextColor={colors.inactive}
                enablesReturnKeyAutomatically={true}
                multiline={true}
                autoCorrect={false}
                autoCapitalize={'none'}
              />
            </View>
          </View>
          <BackupModal isVisible={this.state.visibleModal} onPress={this.onWrongSubmit} />
        </ScrollView>
        <Button
          onPress={this.onSubmit}
          text={t('Finish')}
          standard={false}
          type={BtnTypes.PRIMARY}
          disabled={this.state.pastedMnemonic ? false : true}
        />
        <View style={styles.forgotButtonContainer}>
          <Text style={fontStyles.bodySmall}>{t('dontKnow')} </Text>
          <Link onPress={this.props.showBackupPhrase}>{t('return')}</Link>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  body: {
    paddingBottom: 15,
  },
  questionTextContainer: {
    paddingHorizontal: 30,
  },
  question: {
    color: colors.dark,
    paddingVertical: 15,
  },
  questionPhrase: {
    color: colors.darkSecondary,
    textAlign: 'left',
  },
  backupInput: {
    height: 124,
  },
  inputError: {
    borderColor: colors.errorRed,
  },
  forgotButtonContainer: {
    flexDirection: 'row',
    marginTop: 5,
    paddingVertical: 20,
    justifyContent: 'center',
  },
})

export default withNamespaces(Namespaces.backupKeyFlow6)(BackupVerify)
