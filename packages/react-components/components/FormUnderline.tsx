import colors from '@celo/react-components/styles/colors'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export default function FormUnderline() {
  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    backgroundColor: colors.onboardingBrownLight,
    opacity: 0.2,
  },
})
