import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Clipboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import Logger from 'src/utils/Logger'

type Props = {
  onPress: () => void
  mnemonic: string | null
} & WithNamespaces

interface State {
  selectedAnswer: string | null
}

class BackupComplete extends React.Component<Props, State> {
  static navigationOptions = {
    header: null,
  }

  state = {
    selectedAnswer: null,
  }

  onSelectAnswer = (word: string) => this.setState({ selectedAnswer: word })

  onDone = () => {
    CeloAnalytics.track(CustomEventNames.questions_done)
    this.props.onPress()
  }

  copyToClipboard = () => {
    const { t } = this.props
    Clipboard.setString(this.props.mnemonic || '')
    Logger.showMessage(t('copiedToClipboard'))
  }

  render() {
    const { t } = this.props
    return (
      <View style={styles.container}>
        <View style={styles.questionTextContainer}>
          <NuxLogo />
          <Text style={[fontStyles.h1, styles.h1]}>{t('backupKeySet')}</Text>
          <Text style={fontStyles.body}>{t('dontLoseIt')}</Text>
          <TouchableOpacity style={styles.copyToClipboardContainer} onPress={this.copyToClipboard}>
            <Text style={fontStyles.h2}>{t('copyToClipboard')}</Text>
          </TouchableOpacity>
        </View>
        <Button onPress={this.onDone} text={t('done')} standard={true} type={BtnTypes.PRIMARY} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    flexDirection: 'column',
    paddingHorizontal: 20,
  },
  questionTextContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  h1: {
    color: colors.dark,
    paddingTop: 35,
  },
  copyToClipboardContainer: {
    marginTop: 40,
  },
})

export default componentWithAnalytics(withNamespaces(Namespaces.backupKeyFlow6)(BackupComplete))
