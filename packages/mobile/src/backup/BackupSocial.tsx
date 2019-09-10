import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FlagSecure from 'react-native-flag-secure-android'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import BackupPhraseContainer from 'src/backup/BackupPhraseContainer'
import { splitMnemonic } from 'src/backup/utils'
import CancelButton from 'src/components/CancelButton'
import { Namespaces } from 'src/i18n'

type Props = {
  words: string
  language: string | null
  onPressBackup: () => void
  onPressSocialBackup: () => void
  onCancel: () => void
} & WithNamespaces

class BackupPhrase extends React.Component<Props> {
  static navigationOptions = { header: null }

  componentDidMount() {
    FlagSecure.activate()
  }

  componentWillUnmount() {
    FlagSecure.deactivate()
  }

  continueBackup = () => {
    CeloAnalytics.track(CustomEventNames.backup_continue)
    this.props.onPressBackup()
  }

  render() {
    const { t, words, language } = this.props
    const [firstHalf, secondHalf] = splitMnemonic(words, language)

    return (
      <View style={styles.container}>
        <View style={componentStyles.topBar}>
          <CancelButton onCancel={this.props.onCancel} />
        </View>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <View>
            <Text style={[fontStyles.h1, styles.title]}>{t('socialBackup')}</Text>
            <Text style={styles.verifyText}>{t('socialBackupYourKey')}</Text>
            <Text style={styles.verifyText}>{t('easyToForget')}</Text>
            <BackupPhraseContainer label={t('sendFirstHalf')} words={firstHalf} />
            <BackupPhraseContainer label={t('sendSecondHalf')} words={secondHalf} />
          </View>
          <View>
            <Button
              onPress={this.continueBackup}
              text={t('continue')}
              standard={true}
              type={BtnTypes.PRIMARY}
            />
          </View>
        </KeyboardAwareScrollView>
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
  scrollContainer: {
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    marginVertical: 10,
    color: colors.dark,
  },
  body: {
    paddingBottom: 15,
    color: colors.dark,
  },
  phraseContainer: {
    position: 'relative',
    backgroundColor: colors.altDarkBg,
    alignContent: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 30,
  },
  phraseText: {
    ...fontStyles.h2,
    textAlign: 'left',
  },
  verifyText: {
    ...fontStyles.bodySmall,
    fontSize: 15,
    textAlign: 'left',
    paddingTop: 15,
  },
  buttonSpacing: {
    marginTop: 20,
    marginLeft: 5,
  },
})

export default componentWithAnalytics(withNamespaces(Namespaces.backupKeyFlow6)(BackupPhrase))
