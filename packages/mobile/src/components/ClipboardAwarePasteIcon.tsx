// VIEW Paste icon that disappears when the |currentValue| passed matches the content
// of the clipboard.

import Touchable from '@celo/react-components/components/Touchable'
import {
  PasteAwareWrappedElementProps,
  withPasteAware,
} from '@celo/react-components/components/WithPasteAware'
import Paste from '@celo/react-components/icons/Paste'
import { iconHitslop } from '@celo/react-components/styles/variables'
import React from 'react'
import { StyleProp, ViewProps, ViewStyle } from 'react-native'

interface PasteAwareProps {
  style?: StyleProp<ViewStyle>
  color: string
  testID?: string
  onChangeText: (text: string) => void
  value: string
}

export default function ClipboardAwarePasteIcon({
  style,
  color,
  testID,
  ...otherProps
}: PasteAwareProps) {
  class Wrapper extends React.Component<ViewProps & PasteAwareWrappedElementProps> {
    render() {
      const { isPasteIconVisible, onPressPaste } = this.props
      if (!isPasteIconVisible) {
        return null
      }
      return (
        <Touchable testID={testID} style={style} onPress={onPressPaste} hitSlop={iconHitslop}>
          <Paste color={color} />
        </Touchable>
      )
    }
  }

  const Icon = withPasteAware(Wrapper)
  const shouldShowClipboard = () => true
  return <Icon shouldShowClipboard={shouldShowClipboard} {...otherProps} />
}
