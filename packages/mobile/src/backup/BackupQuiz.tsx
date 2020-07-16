import TextButton from '@celo/react-components/components/TextButton.v2'
import Touchable from '@celo/react-components/components/Touchable'
import Backspace from '@celo/react-components/icons/Backspace'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { StackNavigationOptions, StackScreenProps } from '@react-navigation/stack'
import { chunk, flatMap, shuffle, times } from 'lodash'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { setBackupCompleted } from 'src/account/actions'
import { showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import { BackQuizProgress } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CancelConfirm from 'src/backup/CancelConfirm'
import { QuizzBottom } from 'src/backup/QuizzBottom'
import { getStoredMnemonic, onGetMnemonicFail } from 'src/backup/utils'
import DevSkipButton from 'src/components/DevSkipButton'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'backup/BackupQuiz'

const MNEMONIC_BUTTONS_TO_DISPLAY = 6

// miliseconds to wait until showing success or failure
const CHECKING_DURATION = 1.8 * 1000

export enum Mode {
  Entering,
  Checking,
  Failed,
}

interface State {
  mode: Mode
  mnemonic: string
  mnemonicLength: number
  mnemonicWords: string[]
  userChosenWords: Array<{
    word: string
    index: number
  }>
}

interface StateProps {
  account: string | null
}

interface DispatchProps {
  setBackupCompleted: typeof setBackupCompleted
  showError: typeof showError
}

type OwnProps = StackScreenProps<StackParamList, Screens.BackupQuiz>

type Props = WithTranslation & StateProps & DispatchProps & OwnProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    account: currentAccountSelector(state),
  }
}

export const navOptionsForQuiz: StackNavigationOptions = {
  ...emptyHeader,
  headerLeft: () => <CancelConfirm screen={TAG} />,
  headerTitle: i18n.t(`${Namespaces.backupKeyFlow6}:headerTitle`),
}

export class BackupQuiz extends React.Component<Props, State> {
  state: State = {
    mnemonic: '',
    mnemonicLength: 0,
    mnemonicWords: [],
    userChosenWords: [],
    mode: Mode.Entering,
  }

  setBackSpace = () => {
    const isVisible = this.state.userChosenWords.length > 0 && this.state.mode === Mode.Entering

    this.props.navigation.setOptions({
      headerRight: () => (
        <DeleteWord onPressBackspace={this.onPressBackspace} visible={isVisible} />
      ),
    })
  }
  componentDidUpdate = () => {
    this.setBackSpace()
  }

  componentDidMount = async () => {
    await this.retrieveMnemonic()
    ValoraAnalytics.track(OnboardingEvents.backup_quiz_start)
  }

  retrieveMnemonic = async () => {
    const mnemonic = await getStoredMnemonic(this.props.account)
    if (mnemonic) {
      const shuffledMnemonic = getShuffledWordSet(mnemonic)

      this.setState({
        mnemonic,
        mnemonicWords: shuffledMnemonic,
        mnemonicLength: shuffledMnemonic.length,
      })
    } else {
      onGetMnemonicFail(this.props.showError, 'BackupQuiz')
    }
  }

  onPressMnemonicWord = (word: string, index: number) => {
    const { mnemonicWords, userChosenWords } = this.state
    const mnemonicWordsUpdated = [...mnemonicWords]
    mnemonicWordsUpdated.splice(index, 1)

    const newUserChosenWords = [...userChosenWords, { word, index }]

    this.setState({
      mnemonicWords: mnemonicWordsUpdated,
      userChosenWords: newUserChosenWords,
    })

    ValoraAnalytics.track(OnboardingEvents.backup_quiz_progress, {
      action: BackQuizProgress.word_chosen,
    })
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

    ValoraAnalytics.track(OnboardingEvents.backup_quiz_progress, {
      action: BackQuizProgress.backspace,
    })
  }

  onPressReset = async () => {
    const mnemonic = this.state.mnemonic
    this.setState({
      mnemonicWords: getShuffledWordSet(mnemonic),
      userChosenWords: [],
      mode: Mode.Entering,
    })
  }

  afterCheck = async () => {
    const { userChosenWords, mnemonicLength } = this.state
    const mnemonic = this.state.mnemonic
    const lengthsMatch = userChosenWords.length === mnemonicLength

    if (lengthsMatch && contentMatches(userChosenWords, mnemonic)) {
      Logger.debug(TAG, 'Backup quiz passed')
      this.props.setBackupCompleted()
      navigate(Screens.BackupComplete)
      ValoraAnalytics.track(OnboardingEvents.backup_quiz_complete)
    } else {
      Logger.debug(TAG, 'Backup quiz failed, reseting words')
      this.setState({ mode: Mode.Failed })
      ValoraAnalytics.track(OnboardingEvents.backup_quiz_incorrect)
    }
  }

  onPressSubmit = () => {
    this.setState({ mode: Mode.Checking })
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
    const isQuizComplete = userChosenWords.length === mnemonicLength && mnemonicLength !== 0
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
                  <Text
                    testID={`selected-word-${i}`}
                    style={userChosenWords[i] ? styles.chosenWordFilled : styles.chosenWord}
                  >
                    {(userChosenWords[i] && userChosenWords[i].word) || i + 1}
                  </Text>
                </View>
              ))}
            </View>
            {this.state.mode === Mode.Failed && (
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
                  <Word
                    key={word}
                    word={word}
                    index={index}
                    onPressWord={this.onPressMnemonicWord}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
          <QuizzBottom
            onPressSubmit={this.onPressSubmit}
            isQuizComplete={isQuizComplete}
            mode={this.state.mode}
          />
        </>
      </SafeAreaView>
    )
  }
}

interface WordProps {
  word: string
  index: number
  onPressWord: (word: string, index: number) => void
}

const Word = React.memo(function _Word({ word, index, onPressWord }: WordProps) {
  const onPressMnemonicWord = React.useCallback(() => {
    onPressWord(word, index)
  }, [word, index])

  return (
    <View key={'mnemonic-button-' + word} style={styles.mnemonicWordButtonOutterRim}>
      <Touchable style={styles.mnemonicWordButton} onPress={onPressMnemonicWord}>
        <Text style={styles.mnemonicWordButonText}>{word}</Text>
      </Touchable>
    </View>
  )
})

interface Content {
  word: string
  index: number
}

function contentMatches(userChosenWords: Content[], mnemonic: string) {
  return userChosenWords.map((w) => w.word).join(' ') === mnemonic
}

function DeleteWord({
  onPressBackspace,
  visible,
}: {
  onPressBackspace: () => void
  visible: boolean
}) {
  if (!visible) {
    return null
  }
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

const styles = StyleSheet.create({
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
    paddingTop: 24,
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

export default connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
  setBackupCompleted,
  showError,
})(withTranslation<Props>(Namespaces.backupKeyFlow6)(BackupQuiz))
