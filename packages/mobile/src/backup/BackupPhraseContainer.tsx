import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Clipboard, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native'
import FlagSecure from 'react-native-flag-secure-android'
import { Namespaces } from 'src/i18n'
import Logger from 'src/utils/Logger'

type Props = {
  words: string | null
  showCopy?: boolean
  headerText?: string
  style?: ViewStyle
} & WithNamespaces

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
    const { words, t } = this.props
    if (!words) {
      return
    }
    Clipboard.setString(words)
    Logger.showMessage(t('copied'))
  }

  render() {
    const { t, words, showCopy, headerText, style } = this.props

    return (
      <View style={style}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{headerText || t('backupKey')}</Text>
          {showCopy && (
            <Touchable borderless={true} onPress={this.onPressCopy}>
              <Text style={styles.headerButton}>{this.props.t('global:copy')}</Text>
            </Touchable>
          )}
        </View>
        <View style={styles.phraseContainer}>
          {!!words && <Text style={styles.phraseText}>{words}</Text>}
        </View>
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
    ...fontStyles.body,
    ...fontStyles.semiBold,
  },
  headerButton: {
    ...fontStyles.headerButton,
    fontSize: 16,
  },
  phraseContainer: {
    marginTop: 10,
    backgroundColor: colors.darkLightest,
    borderRadius: 4,
    alignContent: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  button: {
    alignSelf: 'center',
    flex: 1,
    paddingBottom: 0,
    marginBottom: 0,
  },
  phraseText: {
    ...fontStyles.body,
    lineHeight: 27,
    color: colors.darkSecondary,
  },
})

export default withNamespaces(Namespaces.backupKeyFlow6)(BackupPhraseContainer)
