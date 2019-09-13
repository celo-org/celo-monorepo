import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import SelectionOption from '@celo/react-components/components/SelectionOption'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import BackupModal from 'src/backup/BackupModal'
import { Namespaces } from 'src/i18n'
import Logger from 'src/utils/Logger'

const TAG = 'Backup/BackupQuestion'

type Props = {
  words: string[]
  correctAnswer: string
  onReturnToPhrase: () => void
  onCorrectSubmit: () => void
  onWrongSubmit: () => void
  onCancel: () => void
} & WithNamespaces

interface State {
  selectedAnswer: string | null
  visibleModal: boolean
}

class BackupQuestion extends React.PureComponent<Props, State> {
  state = {
    selectedAnswer: null,
    visibleModal: false,
  }

  eventNames: { [key: string]: CustomEventNames } = {
    cancel: CustomEventNames.question_cancel,
    submit: CustomEventNames.question_submit,
    select: CustomEventNames.question_select,
    incorrect: CustomEventNames.question_incorrect,
  }

  trackAnalytics(name: string, data: object = {}) {
    if (this.eventNames.hasOwnProperty(name)) {
      CeloAnalytics.track(this.eventNames[name], data)
    } else {
      Logger.error(TAG, `Unexpected case for tracking Backup Question ${name}`)
    }
  }

  cancel = () => {
    this.trackAnalytics('cancel')
    this.props.onCancel()
  }

  onSelectAnswer = (word: string) => {
    this.setState({ selectedAnswer: word })
    this.trackAnalytics('select')
  }

  onSubmit = () => {
    if (this.props.correctAnswer === this.state.selectedAnswer) {
      this.trackAnalytics('submit', { isCorrect: true })
      this.props.onCorrectSubmit()
    } else {
      this.setState({ visibleModal: true })
      this.trackAnalytics('submit', { isCorrect: false })
    }
  }

  onWrongSubmit = () => {
    // PILOT_ONLY
    this.trackAnalytics('incorrect')
    this.setState({ visibleModal: false }, () => this.props.onWrongSubmit())
  }

  render() {
    const { t } = this.props
    return (
      <View style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="always">
          <View style={styles.questionTextContainer}>
            <Text style={[fontStyles.body, styles.question]}>
              {t('backupKeyFlow6:verifying', { count: 1, total: 2 })}
            </Text>
            <Text style={[fontStyles.h1]}>{t('questionPhrase')}</Text>
          </View>
          <View style={componentStyles.line} />
          {this.props.words.map((word) => (
            <SelectionOption
              word={word}
              key={word}
              onSelectAnswer={this.onSelectAnswer}
              selected={word === this.state.selectedAnswer}
            />
          ))}
          <BackupModal
            isVisible={this.state.visibleModal}
            title={t('tryAgain')}
            buttonText1={t('seeBackupKey')}
            onPress1={this.onWrongSubmit}
          >
            <Text>{t('backToKey')}</Text>
          </BackupModal>
        </ScrollView>
        <Button
          onPress={this.onSubmit}
          text={t('submit')}
          standard={false}
          type={BtnTypes.PRIMARY}
          disabled={this.state.selectedAnswer ? false : true}
        />
        <View style={styles.forgotButtonContainer}>
          <Text style={fontStyles.bodySmall}>{t('dontKnow')} </Text>
          <Link onPress={this.props.onReturnToPhrase}>{t('return')}</Link>
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
  questionTextContainer: {
    paddingHorizontal: 30,
  },
  question: {
    color: colors.dark,
    paddingVertical: 15,
  },
  forgotButtonContainer: {
    flexDirection: 'row',
    marginTop: 5,
    paddingVertical: 20,
    justifyContent: 'center',
  },
})

export default withNamespaces(Namespaces.backupKeyFlow6)(BackupQuestion)
