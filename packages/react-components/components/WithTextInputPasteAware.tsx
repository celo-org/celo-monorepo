// HOC to add a paste button to a text input

import TouchableDefault from '@celo/react-components/components/Touchable'
import {
  PasteAwareWrappedElementProps,
  withPasteAware,
} from '@celo/react-components/components/WithPasteAware'
import Paste from '@celo/react-components/icons/Paste'
import { iconHitslop } from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, TextInputProps, View, ViewStyle } from 'react-native'

export default function withTextInputPasteAware<P extends TextInputProps>(
  WrappedTextInput: React.ComponentType<P>,
  pasteIconContainerStyle?: ViewStyle
) {
  class Wrapper extends React.Component<P & PasteAwareWrappedElementProps> {
    render() {
      const { isPasteIconVisible, onPressPaste } = this.props
      return (
        <View style={style.container}>
          <WrappedTextInput {...this.props} showClearButton={!isPasteIconVisible} />
          {isPasteIconVisible && (
            <TouchableDefault
              style={[style.pasteIconContainer, pasteIconContainerStyle]}
              onPress={onPressPaste}
              hitSlop={iconHitslop}
            >
              <Paste />
            </TouchableDefault>
          )}
        </View>
      )
    }
  }
  return withPasteAware(Wrapper)
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
