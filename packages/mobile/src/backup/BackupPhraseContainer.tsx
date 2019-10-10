import Button, { BtnTypes } from '@celo/react-components/components/Button'
import CopyIcon from '@celo/react-components/icons/Copy'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Clipboard, StyleSheet, Text, View } from 'react-native'
import FlagSecure from 'react-native-flag-secure-android'
import { Namespaces } from 'src/i18n'
import Logger from 'src/utils/Logger'

type Props = {
  words: string | null
  showCopy?: boolean
  showWhatsApp?: boolean
  onShare?: () => void
} & WithNamespaces

export class BackupPhraseContainer extends React.Component<Props> {
  async componentDidMount() {
    FlagSecure.activate()
  }

  componentWillUnmount() {
    FlagSecure.deactivate()
  }

  onShare = () => {
    const { onShare } = this.props
    if (onShare) {
      onShare()
    }
  }

  copy = () => {
    const { words, t } = this.props
    if (!words) {
      return
    }
    Clipboard.setString(words)
    Logger.showMessage(t('copied'))
    this.onShare()
  }

  render() {
    const { t, words, showCopy } = this.props

    return (
      <View style={styles.phraseContainer}>
        {!!words && (
          <>
            <Text style={styles.phraseText}>{`${words}`}</Text>
            {showCopy && (
              <Button
                onPress={this.copy}
                text={t('global:copy')}
                style={styles.button}
                standard={true}
                type={BtnTypes.QUATERNARY}
                lineHeight={40}
              >
                <CopyIcon color={colors.celoGreen} height={18} width={23} />
              </Button>
            )}
          </>
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  phraseContainer: {
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
