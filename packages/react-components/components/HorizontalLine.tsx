import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'

export default function HorizontalLine() {
  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderStyle: 'solid',
    borderTopWidth: 1,
    borderTopColor: colors.darkLightest,
    marginTop: 10,
    marginBottom: 15,
  },
})
