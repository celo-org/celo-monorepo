import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import SmallButton from '@celo/react-components/components/SmallButton'
import Backspace from '@celo/react-components/icons/Backspace'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as _ from 'lodash'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { setBackupCompleted } from 'src/account/actions'
import { showError } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

const TAG = 'backup/BackupQuiz'

const MNEMONIC_BUTTONS_TO_DISPLAY = 6

interface State {
  mnemonicLength: number
  mnemonicWords: string[]
  userChosenWords: Array<{
    word: string
    index: number
  }>
}

interface DispatchProps {
  setBackupCompleted: typeof setBackupCompleted
  showError: typeof showError
}

type Props = WithNamespaces & DispatchProps & NavigationInjectedProps

export class BackupQuiz extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  state: State = {
    mnemonicLength: 0,
    mnemonicWords: [],
    userChosenWords: [],
  }

  componentDidMount() {
    const mnemonic = this.getMnemonicFromNavProps()
    const shuffledMnemonic = this.getShuffledWordSet(mnemonic)
    this.setState({
      mnemonicWords: shuffledMnemonic,
      mnemonicLength: shuffledMnemonic.length,
    })
  }

  getMnemonicFromNavProps(): string {
    const mnemonic = this.props.navigation.getParam('mnemonic', '')
    if (!mnemonic) {
      throw new Error('Mnemonic missing form nav props')
    }
    return mnemonic
  }

  getShuffledWordSet(mnemonic: string) {
    return _.flatMap(
      _.chunk(mnemonic.split(' '), MNEMONIC_BUTTONS_TO_DISPLAY).map((chunk) => _.shuffle(chunk))
    )
  }

  onPressMnemonicWord = (word: string, index: number) => {
    return () => {
      const { mnemonicWords, userChosenWords } = this.state
      const mnemonicWordsUpdated = [...mnemonicWords]
      mnemonicWordsUpdated.splice(index, 1)

      this.setState({
        mnemonicWords: mnemonicWordsUpdated,
        userChosenWords: [...userChosenWords, { word, index }],
      })
    }
  }

  onPressBackspace = () => {
    const { mnemonicWords, userChosenWords } = this.state

    if (!userChosenWords.length) {
      return
    }

    const userChosenWordsUpdated = [...userChosenWords]
    const lastWord = userChosenWordsUpdated.pop()
    const mnemonicWordsUpdated = [...mnemonicWords]
    mnemonicWordsUpdated.splice(lastWord!.index, 0, lastWord!.word)

    this.setState({
      mnemonicWords: mnemonicWordsUpdated,
      userChosenWords: userChosenWordsUpdated,
    })
  }

  onPressReset = () => {
    const mnemonic = this.getMnemonicFromNavProps()
    this.setState({
      mnemonicWords: this.getShuffledWordSet(mnemonic),
      userChosenWords: [],
    })
  }

  onPressSubmit = () => {
    const { userChosenWords, mnemonicLength } = this.state
    const mnemonic = this.getMnemonicFromNavProps()
    if (
      userChosenWords.length === mnemonicLength &&
      userChosenWords.map((w) => w.word).join(' ') === mnemonic
    ) {
      Logger.debug(TAG, 'Backup quiz passed')
      this.props.setBackupCompleted()
      navigate(Screens.BackupComplete)
    } else {
      Logger.debug(TAG, 'Backup quiz failed, reseting words')
      this.props.showError(ErrorMessages.BACKUP_QUIZ_FAILED)
      this.onPressReset()
    }
  }

  onScreenSkip = () => {
    Logger.debug(TAG, 'Skipping backup quiz')
    this.props.setBackupCompleted()
  }

  render() {
    const { t } = this.props
    const { mnemonicWords: mnemonicWordButtons, userChosenWords, mnemonicLength } = this.state
    const currentWordIndex = userChosenWords.length + 1
    const isQuizComplete = userChosenWords.length === mnemonicLength
    const mnemonicWordsToDisplay = mnemonicWordButtons.slice(0, MNEMONIC_BUTTONS_TO_DISPLAY)

    return (
      <SafeAreaView style={styles.container}>
        <DevSkipButton nextScreen={Screens.BackupComplete} onSkip={this.onScreenSkip} />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={fontStyles.h1}>{t('confirmBackupKey')}</Text>
          <View style={styles.chosenWordsContainer}>
            {_.times(mnemonicLength, (i) => (
              <Text
                key={`selected-word-${i}`}
                style={[styles.chosenWord, userChosenWords[i] && styles.chosenWordFilled]}
              >
                {(userChosenWords[i] && userChosenWords[i].word) || i + 1}
              </Text>
            ))}
          </View>
          <Text style={styles.bodyText}>{t('backupQuizInfo')}</Text>
          {!isQuizComplete && (
            <Text style={styles.bodyTextBold}>
              {t('backupQuizWordCount', { index: currentWordIndex, total: mnemonicLength })}
            </Text>
          )}
          <View style={styles.mnemonicButtonsContainer}>
            {mnemonicWordsToDisplay.map((word, index) => (
              <SmallButton
                key={'mnemonic-button-' + word}
                solid={false}
                text={word}
                style={styles.mnemonicWordButton}
                onPress={this.onPressMnemonicWord(word, index)}
              />
            ))}
          </View>
          <View style={styles.backButtonsContainer}>
            {currentWordIndex > 1 && (
              <SmallButton
                onPress={this.onPressBackspace}
                solid={false}
                text={this.props.t('global:goBack')}
                style={styles.backButton}
                textStyle={fontStyles.link}
              >
                <Backspace color={colors.celoGreen} />
              </SmallButton>
            )}
            {isQuizComplete && (
              <Link onPress={this.onPressReset} style={styles.resetButton}>
                {t('global:reset')}
              </Link>
            )}
          </View>
        </ScrollView>
        {isQuizComplete && (
          <Button
            onPress={this.onPressSubmit}
            text={t('global:submit')}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID={'QuizSubmit'}
          />
        )}
      </SafeAreaView>
    )
  }
}

export default componentWithAnalytics(
  connect<{}, DispatchProps, {}, RootState>(
    null,
    { setBackupCompleted, showError }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupQuiz))
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bodyText: {
    marginTop: 20,
    ...fontStyles.bodySecondary,
    color: colors.lightGray,
    textAlign: 'center',
  },
  bodyTextBold: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    textAlign: 'center',
    marginTop: 25,
  },
  chosenWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chosenWord: {
    ...fontStyles.bodySmall,
    lineHeight: undefined,
    color: colors.lightGray,
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginHorizontal: 3,
    marginVertical: 4,
    minWidth: 55,
    borderWidth: 1,
    borderColor: colors.darkLightest,
    borderRadius: 100,
  },
  chosenWordFilled: {
    backgroundColor: colors.darkLightest,
    color: colors.darkSecondary,
  },
  mnemonicButtonsContainer: {
    marginTop: 25,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mnemonicWordButton: {
    borderRadius: 100,
    minWidth: 0,
    marginVertical: 5,
    marginHorizontal: 5,
  },
  backButtonsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    borderWidth: 0,
    minWidth: 60,
  },
  resetButton: {
    ...fontStyles.link,
    paddingTop: 8,
    paddingLeft: 35,
    paddingRight: 20,
  },
})
