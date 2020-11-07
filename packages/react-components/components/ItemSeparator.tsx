import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export default function ItemSeparator() {
  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    backgroundColor: colors.gray2,
    marginHorizontal: variables.contentPadding,
  },
})
