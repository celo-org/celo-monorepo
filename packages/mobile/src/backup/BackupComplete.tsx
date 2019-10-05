import Button, { BtnTypes } from '@celo/react-components/components/Button'
import SmallButton from '@celo/react-components/components/SmallButton'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Clipboard, ScrollView, StyleSheet, Text, View } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import BackupPhraseContainer from 'src/backup/BackupPhraseContainer'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import Logger from 'src/utils/Logger'

type Props = {
  onPress: () => void
  mnemonic: string | null
  backupCompleted?: boolean
} & WithNamespaces

interface State {
  selectedAnswer: string | null
}

class BackupComplete extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state = {
    selectedAnswer: null,
  }

  onSelectAnswer = (word: string) => this.setState({ selectedAnswer: word })

  onDone = () => {
    const { backupCompleted } = this.props

    // Only track when going through backup flow, not viewing the backup again
    if (!backupCompleted) {
      CeloAnalytics.track(CustomEventNames.questions_done)
    }
    this.props.onPress()
  }

  copyToClipboard = () => {
    const { t } = this.props
    Clipboard.setString(this.props.mnemonic || '')
    Logger.showMessage(t('copiedToClipboard'))
  }

  render() {
    const { t, backupCompleted, mnemonic } = this.props
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.questionTextContainer}
          contentContainerStyle={styles.scrollContainer}
        >
          <NuxLogo />
          <Text style={[fontStyles.h1, styles.h1]}>
            {t(backupCompleted ? 'backupKey' : 'backupKeySet')}
          </Text>
          <Text style={fontStyles.body}>{t('dontLoseIt')}</Text>
          {backupCompleted && <BackupPhraseContainer words={mnemonic} />}
          <SmallButton
            text={t('copyToClipboard')}
            testID={'pasteMessageButton'}
            onPress={this.copyToClipboard}
            solid={false}
            style={styles.copyToClipboardButton}
          />
        </ScrollView>
        <Button onPress={this.onDone} text={t('done')} standard={true} type={BtnTypes.PRIMARY} />
      </View>
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
    // https://medium.com/@peterpme/taming-react-natives-scrollview-with-flex-144e6ff76c08
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  questionTextContainer: {
    flex: 1,
  },
  h1: {
    color: colors.dark,
    paddingTop: 25,
  },
  copyToClipboardButton: {
    marginTop: 50,
    alignSelf: 'center',
    fontSize: 14,
  },
})

export default componentWithAnalytics(withNamespaces(Namespaces.backupKeyFlow6)(BackupComplete))
