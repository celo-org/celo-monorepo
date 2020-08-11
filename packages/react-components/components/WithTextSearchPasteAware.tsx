// HOC to add a paste button to a text input
import TouchableDefault from '@celo/react-components/components/Touchable'
import {
  PasteAwareWrappedElementProps,
  withPasteAware,
} from '@celo/react-components/components/WithPasteAware'
import Paste from '@celo/react-components/icons/Paste'
import Search from '@celo/react-components/icons/Search'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, TextInputProps, View } from 'react-native'

const HEIGHT = 36

export default function withTextSearchPasteAware<P extends TextInputProps>(
  WrappedTextInput: React.ComponentType<P>
) {
  class Wrapper extends React.Component<P & PasteAwareWrappedElementProps> {
    render() {
      const { style, isPasteIconVisible, onPressPaste } = this.props
      return (
        <View style={[styles.container, style]}>
          <View style={styles.searchIconContainer}>
            <Search />
          </View>
          <WrappedTextInput
            {...this.props}
            inputStyle={styles.input}
            testID="SearchInput"
            showClearButton={!isPasteIconVisible}
          />
          {isPasteIconVisible && (
            <TouchableDefault onPress={onPressPaste}>
              <Paste />
            </TouchableDefault>
          )}
        </View>
      )
    }
  }

  return withPasteAware(Wrapper)
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderColor: colors.gray2,
    borderWidth: 1.5,
    paddingRight: 8,
  },
  searchIconContainer: {
    marginLeft: 17,
    marginRight: 13,
  },
  input: {
    paddingVertical: 6,
  },
})
