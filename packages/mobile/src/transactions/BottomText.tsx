import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { StyleSheet, Text } from 'react-native'

interface BottomTextProps {
  children: React.ReactNode
}

export default function BottomText({ children }: BottomTextProps) {
  return <Text style={styles.text}>{children}</Text>
}

const styles = StyleSheet.create({
  text: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
    marginTop: 'auto',
  },
})
