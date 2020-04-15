import * as React from 'react'
import { StyleSheet, Text, TextStyle } from 'react-native'
import MessageDisplay from 'src/forms/MessageDisplay'
import Checkmark from 'src/icons/Checkmark'
import { colors } from 'src/styles'

interface Props {
  isShowing: boolean
  message: string
  style?: TextStyle
}

export default React.memo(({ message, style, isShowing }: Props) => {
  return (
    <MessageDisplay isShowing={isShowing} style={[styles.success, style]}>
      <>
        <Checkmark color={colors.primary} size={16} />
        <Text style={styles.message}>{message}</Text>
      </>
    </MessageDisplay>
  )
})

const styles = StyleSheet.create({
  success: {
    color: colors.primary,
    fontWeight: '500',
  },
  message: {
    marginStart: 10,
  },
})
