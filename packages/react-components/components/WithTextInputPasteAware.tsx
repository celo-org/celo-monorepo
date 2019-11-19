// HOC to add a paste button to a text input

import TouchableDefault from '@celo/react-components/components/Touchable'
import Paste from '@celo/react-components/icons/Paste'
import { iconHitslop } from '@celo/react-components/styles/variables'
import * as React from 'react'
import { AppState, Clipboard, StyleSheet, TextInputProps, View, ViewStyle } from 'react-native'

interface PasteAwareProps {
  value: string
  shouldShowClipboard: (value: string) => boolean
  onChangeText: (text: string) => void
}

export default function withTextInputPasteAware<P extends TextInputProps>(
  WrappedTextInput: React.ComponentType<P>,
  pasteIconContainerStyle?: ViewStyle
) {
  return class WithTextInputLabeling extends React.Component<P & PasteAwareProps> {
    state = {
      isPasteIconVisible: false,
    }

    _isMounted = false

    async componentDidMount() {
      this._isMounted = true
      AppState.addEventListener('change', this.checkClipboardContents)
      await this.checkClipboardContents()
    }

    componentWillUnmount() {
      this._isMounted = false
      AppState.removeEventListener('change', this.checkClipboardContents)
    }

    checkClipboardContents = async () => {
      try {
        const clipboardContent = await Clipboard.getString()
        if (!this._isMounted) {
          return
        }

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
      this.setState({ isPasteIconVisible: false })
      this.props.onChangeText(clipboardContents)
    }

    render() {
      const { isPasteIconVisible } = this.state

      return (
        <View style={style.container}>
          <WrappedTextInput {...this.props} showClearButton={!isPasteIconVisible} />
          {isPasteIconVisible && (
            <TouchableDefault
              style={[style.pasteIconContainer, pasteIconContainerStyle]}
              onPress={this.onPressPate}
              hitSlop={iconHitslop}
            >
              <Paste />
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
