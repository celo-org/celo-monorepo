import Touchable from '@celo/react-components/components/Touchable'
import withTextInputPasteAware from '@celo/react-components/components/WithTextInputPasteAware'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Clipboard, Platform, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native'
import FlagSecure from 'react-native-flag-secure-android'
import { isValidBackupPhrase, isValidSocialBackupPhrase } from 'src/backup/utils'
import { Namespaces, withTranslation } from 'src/i18n'
import Logger from 'src/utils/Logger'

const PhraseInput = withTextInputPasteAware(TextInput, { top: undefined, right: 12, bottom: 12 })

export enum BackupPhraseContainerMode {
  READONLY = 'READONLY',
  INPUT = 'INPUT',
}

export enum BackupPhraseType {
  BACKUP_KEY = 'BACKUP_KEY',
  SOCIAL_BACKUP = 'SOCIAL_BACKUP',
}

type Props = {
  value: string | null
  mode: BackupPhraseContainerMode
  type: BackupPhraseType
  index?: number // e.g. index of safeguard phrase
  showCopy?: boolean
  style?: ViewStyle
  onChangeText?: (value: string) => void
  testID?: string
} & WithTranslation

export class BackupPhraseContainer extends React.Component<Props> {
  async componentDidMount() {
    if (Platform.OS === 'android') {
      FlagSecure.activate()
    } else if (Platform.OS === 'ios') {
      // TODO add iOS support
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      FlagSecure.deactivate()
    } else if (Platform.OS === 'ios') {
      // TODO add iOS support
    }
  }

  onPressCopy = () => {
    const { value: words, t } = this.props
    if (!words) {
      return
    }
    Clipboard.setString(words)
    Logger.showMessage(t('copied'))
  }

  onPhraseInputChange = (value: string) => {
    if (this.props.onChangeText) {
      this.props.onChangeText(value)
    }
  }

  render() {
    const { t, value: words, showCopy, style, mode, type, index, testID } = this.props

    return (
      <View style={style}>
        <View style={styles.headerContainer}>
          {type === BackupPhraseType.BACKUP_KEY &&
            (BackupPhraseContainerMode.INPUT ? (
              <View style={styles.writeDownKeyContainer}>
                <Text style={styles.writeDownKey}>{t('writeDownKey')}</Text>
                <Text style={fontStyles.label}>{t('yourAccountKey')}</Text>
              </View>
            ) : (
              <Text style={styles.headerText}>{t('yourAccountKey')}</Text>
            ))}
          {type === BackupPhraseType.SOCIAL_BACKUP && (
            <Text style={styles.headerText}>{t('socialBackupPhraseHeader', { index })}</Text>
          )}
          {showCopy && (
            <Touchable borderless={true} onPress={this.onPressCopy}>
              <Text style={styles.headerButton}>{this.props.t('global:copy')}</Text>
            </Touchable>
          )}
        </View>
        {mode === BackupPhraseContainerMode.READONLY && (
          <View style={styles.phraseContainer}>
            {!!words && <Text style={styles.phraseText}>{words}</Text>}
          </View>
        )}
        {mode === BackupPhraseContainerMode.INPUT && (
          <View style={styles.phraseInputContainer}>
            <PhraseInput
              style={[
                styles.phraseInputText,
                type === BackupPhraseType.SOCIAL_BACKUP && styles.socialPhraseInputText,
              ]}
              value={words || ''}
              placeholder={t('backupPhrasePlaceholder')}
              onChangeText={this.onPhraseInputChange}
              shouldShowClipboard={
                type === BackupPhraseType.BACKUP_KEY
                  ? isValidBackupPhrase
                  : isValidSocialBackupPhrase
              }
              underlineColorAndroid="transparent"
              placeholderTextColor={colors.gray4}
              enablesReturnKeyAutomatically={true}
              multiline={true}
              autoCorrect={false}
              autoCapitalize={'none'}
              testID={testID}
            />
          </View>
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headerText: {
    ...fontStyles.regular500,
    marginBottom: 8,
  },
  headerButton: {
    ...fontStyles.regular,
  },
  writeDownKeyContainer: {
    flexDirection: 'column',
  },
  writeDownKey: {
    ...fontStyles.h2,
    marginBottom: 16,
  },
  phraseContainer: {
    marginTop: 8,
    backgroundColor: colors.beige,
    borderRadius: 4,
    alignContent: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  phraseText: {
    ...fontStyles.regular,
  },
  phraseInputContainer: {
    marginTop: 10,
  },
  phraseInputText: {
    ...fontStyles.regular,
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 4,
    minHeight: 125,
    padding: 14,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  socialPhraseInputText: {
    minHeight: 90,
  },
  button: {
    alignSelf: 'center',
    flex: 1,
    paddingBottom: 0,
    marginBottom: 0,
  },
})

export default withTranslation<Props>(Namespaces.backupKeyFlow6)(BackupPhraseContainer)
