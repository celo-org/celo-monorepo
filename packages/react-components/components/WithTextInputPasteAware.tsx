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

interface PasteAwareState {
  isPasteIconVisible: boolean
  clipboardContent: string | null
}

export default function withTextInputPasteAware<P extends TextInputProps>(
  WrappedTextInput: React.ComponentType<P>,
  pasteIconContainerStyle?: ViewStyle
) {
  return class WithTextInputLabeling extends React.Component<P & PasteAwareProps> {
    state: PasteAwareState = {
      isPasteIconVisible: false,
      clipboardContent: null,
    }

    _interval?: number
    _isMounted = false

    async componentDidMount() {
      this._isMounted = true
      AppState.addEventListener('change', this.checkClipboardContents)
      this._interval = window.setInterval(async () => {
        await this.checkClipboardContents()
      }, 1000) // Every 1s
      await this.checkClipboardContents()
    }

    componentWillUnmount() {
      this._isMounted = false
      AppState.removeEventListener('change', this.checkClipboardContents)
      clearInterval(this._interval)
    }

    checkClipboardContents = async () => {
      try {
        const clipboardContent = await Clipboard.getString()
        if (!this._isMounted) {
          return
        }

        const { shouldShowClipboard, value } = this.props
        if (
          clipboardContent &&
          !(value && clipboardContent.toLowerCase().includes(value.toLowerCase())) &&
          shouldShowClipboard(clipboardContent)
        ) {
          this.setState({ isPasteIconVisible: true, clipboardContent })
        } else {
          this.setState({ isPasteIconVisible: false, clipboardContent: null })
        }
      } catch (error) {
        console.error('Error checking clipboard contents', error)
      }
    }

    onPressPate = () => {
      const { clipboardContent } = this.state
      if (!clipboardContent) {
        console.error('Attempted to paste but clipboard content empty. Should never happen.')
        return
      }
      this.setState({ isPasteIconVisible: false, clipboardContent: null })
      this.props.onChangeText(clipboardContent)
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
    backgroundColor: '#ffffff',
    position: 'absolute',
    right: 11,
    top: 13,
    padding: 4,
    width: 20,
    height: 25,
    zIndex: 100,
  },
})
