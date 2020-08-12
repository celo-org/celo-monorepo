import TextInput, { TextInputProps } from '@celo/react-components/components/TextInput.v2'
import Search from '@celo/react-components/icons/Search'
import colors from '@celo/react-components/styles/colors'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const HEIGHT = 36

type Props = TextInputProps

export default function SearchInput({ style, ...passThroughProps }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Search />
      </View>
      <TextInput {...passThroughProps} inputStyle={styles.input} testID="SearchInput" />
    </View>
  )
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
  iconContainer: {
    marginLeft: 17,
    marginRight: 13,
  },
  input: {
    paddingVertical: 6,
  },
})
