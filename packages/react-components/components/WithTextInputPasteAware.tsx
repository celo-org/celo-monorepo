// HOC to add a paste button to a text input

import TouchableDefault from '@celo/react-components/components/Touchable'
import Copy from '@celo/react-components/icons/Copy'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { AppState, Clipboard, StyleSheet, TextInputProps, View } from 'react-native'

interface PasteAwareProps {
  value: string
  shouldShowClipboard: (value: string) => boolean
  onChangeText: (text: string) => void
}

export default function withTextInputPasteAware<P extends TextInputProps>(
  WrappedTextInput: React.ComponentType<P>
) {
  return class WithTextInputLabeling extends React.Component<P & PasteAwareProps> {
    state = {
      isPasteIconVisible: false,
    }

    async componentDidMount() {
      AppState.addEventListener('change', this.checkClipboardContents)
      await this.checkClipboardContents()
    }

    componentWillUnmount() {
      AppState.removeEventListener('change', this.checkClipboardContents)
    }

    checkClipboardContents = async () => {
      try {
        const clipboardContent = await Clipboard.getString()
        if (
          clipboardContent &&
          clipboardContent !== this.props.value &&
          this.props.shouldShowClipboard(clipboardContent)
        ) {
          this.setState({ isPasteIconVisible: true })
        } else {
          this.setState({ isPasteIconVisible: false })
        }
      } catch (error) {
        console.error('Error checking clipboard contents', error)
      }
    }

    onPressPate = async () => {
      const clipboardContents = await Clipboard.getString()
      this.props.onChangeText(clipboardContents)
      this.setState({ isPasteIconVisible: false })
    }

    render() {
      const { isPasteIconVisible } = this.state

      // TODO(Rossy) Use a more paste-y instead of copy looking icon when we have one
      return (
        <View style={style.container}>
          <WrappedTextInput {...this.props} showClearButton={!isPasteIconVisible} />
          {isPasteIconVisible && (
            <TouchableDefault style={style.pasteIconContainer} onPress={this.onPressPate}>
              <Copy color={colors.celoGreen} />
            </TouchableDefault>
          )}
        </View>
      )
    }
  }
}

const style = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pasteIconContainer: {
    position: 'absolute',
    right: 16,
    top: 18,
    width: 20,
    height: 25,
    zIndex: 100,
  },
})
