import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { StyleSheet, Text } from 'react-native'

interface Props {
  children?: React.ReactNode
}

export default function FormLabel({ children }: Props) {
  return <Text style={styles.container}>{children}</Text>
}

const styles = StyleSheet.create({
  container: {
    ...fontStyles.label,
    color: colors.greenUI,
  },
})
