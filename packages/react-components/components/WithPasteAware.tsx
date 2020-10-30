// HOC to add a paste button to a text input

import { deviceIsIos14OrNewer } from '@celo/react-components/components/utils/IosVersionUtils'
import Clipboard from '@react-native-community/clipboard'
import * as React from 'react'
import { AppState, ViewProps } from 'react-native'

interface PasteAwareProps {
  value: string
  shouldShowClipboard: (value: string) => boolean
  onChangeText: (text: string) => void
}

export interface PasteAwareWrappedElementProps {
  isPasteIconVisible: boolean
  onPressPaste: () => void
  onChangeText: (text: string) => void
}

interface PasteAwareState {
  isPasteIconVisible: boolean
  clipboardContent: string | null
}

export function withPasteAware<P extends ViewProps>(
  WrappedView: React.ComponentType<P & PasteAwareWrappedElementProps>
) {
  return class WithPasteAware extends React.Component<P & PasteAwareProps> {
    state: PasteAwareState = {
      isPasteIconVisible: false,
      clipboardContent: null,
    }

    _interval?: number
    _isMounted = false

    async componentDidMount() {
      this._isMounted = true
      AppState.addEventListener('change', this.checkClipboardContents)
      // TODO: make it work for iOS 14
      // https://9to5mac.com/2020/06/24/ios-14-clipboard-notifications/
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
        if (!this._isMounted) {
          return
        }

        if (deviceIsIos14OrNewer()) {
          const clipboardHasContent = await Clipboard.hasString()
          this.setState({ isPasteIconVisible: clipboardHasContent, clipboardContent: null })
          return
        }

        const clipboardContent = await Clipboard.getString()
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

    onPressPaste = async () => {
      const { clipboardContent: storedClipboardContent } = this.state
      const clipboardContent = storedClipboardContent || (await Clipboard.getString())
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
        <WrappedView
          {...this.props}
          isPasteIconVisible={isPasteIconVisible}
          onPressPaste={this.onPressPaste}
        />
      )
    }
  }
}
