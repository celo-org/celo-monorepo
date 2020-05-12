import TextButton from '@celo/react-components/components/TextButton.v2'
import Touchable from '@celo/react-components/components/Touchable'
import Backspace from '@celo/react-components/icons/Backspace'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { chunk, flatMap, shuffle, times } from 'lodash'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { setBackupCompleted } from 'src/account/actions'
import { showError } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { QuizzBottom } from 'src/backup/QuizzBottom'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces, withTranslation } from 'src/i18n'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

const TAG = 'backup/BackupQuiz'

const MNEMONIC_BUTTONS_TO_DISPLAY = 6

// seconds
const CHECKING_DURATION = 3.1 * 1000

export enum Mode {
  entering,
  checking,
  failed,
}

// TODO Add states for, checking, failed, success
interface State {
  is: Mode
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

type Props = WithTranslation & DispatchProps & NavigationInjectedProps

export class BackupQuiz extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps) => ({
    ...headerWithCancelButton,
    headerRight: <DeleteWord onPressBackspace={navigation.getParam('onPressBackspace')} />,
  })

  state: State = {
    mnemonicLength: 0,
    mnemonicWords: [],
    userChosenWords: [],
    is: Mode.entering,
  }

  componentDidMount() {
    this.props.navigation.setParams({ onPressBackspace: this.onPressBackspace })

    const mnemonic = this.getMnemonicFromNavProps()
    const shuffledMnemonic = getShuffledWordSet(mnemonic)
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
      mnemonicWords: getShuffledWordSet(mnemonic),
      userChosenWords: [],
      is: Mode.entering,
    })
  }

  afterCheck = () => {
    const { userChosenWords, mnemonicLength } = this.state
    const mnemonic = this.getMnemonicFromNavProps()
    const lengthsMatch = userChosenWords.length === mnemonicLength

    if (lengthsMatch && userChosenWords.map((w) => w.word).join(' ') === mnemonic) {
      Logger.debug(TAG, 'Backup quiz passed')
      this.props.setBackupCompleted()
      navigate(Screens.BackupComplete)
    } else {
      Logger.debug(TAG, 'Backup quiz failed, reseting words')
      this.setState({ is: Mode.failed })
    }
  }

  onPressSubmit = () => {
    this.setState({ is: Mode.checking })
    setTimeout(this.afterCheck, CHECKING_DURATION)
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
        <>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.chosenWordsContainer}>
              {times(mnemonicLength, (i) => (
                <View
                  style={[
                    styles.chosenWordWrapper,
                    userChosenWords[i] && styles.chosenWordWrapperFilled,
                  ]}
                  key={`selected-word-${i}`}
                >
                  <Text style={userChosenWords[i] ? styles.chosenWordFilled : styles.chosenWord}>
                    {(userChosenWords[i] && userChosenWords[i].word) || i + 1}
                  </Text>
                </View>
              ))}
            </View>
            {this.state.is === Mode.failed && (
              <View style={styles.resetButton}>
                <TextButton onPress={this.onPressReset}>{t('global:reset')}</TextButton>
              </View>
            )}
            <View style={styles.bottomHalf}>
              {!isQuizComplete && (
                <Text style={styles.bodyText}>
                  <Trans
                    i18nKey={'backupQuizWordCount'}
                    ns={Namespaces.backupKeyFlow6}
                    tOptions={{ ordinal: t(`global:ordinals.${currentWordIndex}`) }}
                  >
                    <Text style={styles.bodyTextBold}>X</Text>
                  </Trans>
                </Text>
              )}
              <View style={styles.mnemonicButtonsContainer}>
                {mnemonicWordsToDisplay.map((word, index) => (
                  <View key={'mnemonic-button-' + word} style={styles.mnemonicWordButtonOutterRim}>
                    <Touchable
                      style={styles.mnemonicWordButton}
                      onPress={this.onPressMnemonicWord(word, index)}
                    >
                      <Text style={styles.mnemonicWordButonText}>{word}</Text>
                    </Touchable>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          <QuizzBottom
            onPressSubmit={this.onPressSubmit}
            isQuizComplete={isQuizComplete}
            mode={this.state.is}
          />
        </>
      </SafeAreaView>
    )
  }
}

function DeleteWord({ onPressBackspace }: { onPressBackspace: () => void }) {
  return (
    <Touchable borderless={true} onPress={onPressBackspace} style={styles.backWord}>
      <Backspace color={colors.greenUI} />
    </Touchable>
  )
}

function getShuffledWordSet(mnemonic: string) {
  return flatMap(
    chunk(mnemonic.split(' '), MNEMONIC_BUTTONS_TO_DISPLAY).map((mnemonicChunk) =>
      shuffle(mnemonicChunk)
    )
  )
}

export default componentWithAnalytics(
  connect<{}, DispatchProps, {}, RootState>(null, { setBackupCompleted, showError })(
    withTranslation(Namespaces.backupKeyFlow6)(BackupQuiz)
  )
)

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  bottomHalf: { flex: 1, justifyContent: 'center' },
  bodyText: {
    marginTop: 20,
    ...fontStyles.regular,
    color: colors.dark,
    textAlign: 'center',
  },
  bodyTextBold: {
    ...fontStyles.regular500,
    textAlign: 'center',
    marginTop: 25,
  },
  chosenWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 288,
    alignSelf: 'center',
  },
  chosenWordWrapper: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 3,
    marginVertical: 4,
    minWidth: 55,
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 100,
  },
  chosenWordWrapperFilled: {
    backgroundColor: colors.gray2,
  },
  chosenWord: {
    ...fontStyles.small,
    textAlign: 'center',
    lineHeight: undefined,
    color: colors.gray4,
  },
  chosenWordFilled: {
    ...fontStyles.small,
    textAlign: 'center',
    lineHeight: undefined,
    color: colors.gray5,
  },
  mnemonicButtonsContainer: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mnemonicWordButtonOutterRim: {
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: colors.greenUI,
    overflow: 'hidden',
    marginVertical: 4,
    marginHorizontal: 4,
  },
  mnemonicWordButton: {
    borderRadius: 100,
    minWidth: 65,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mnemonicWordButonText: {
    textAlign: 'center',
    color: colors.greenUI,
  },
  backWord: {
    paddingRight: 24,
    paddingLeft: 16,
    paddingVertical: 4,
  },
  resetButton: { alignItems: 'center', padding: 24, marginTop: 8 },
})
