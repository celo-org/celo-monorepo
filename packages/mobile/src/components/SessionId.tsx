import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import Clipboard from '@react-native-community/clipboard'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import Logger from 'src/utils/Logger'

interface Props {
  sessionId: string
}

export default function SessionId({ sessionId }: Props) {
  const onPressSessionId = () => {
    if (!sessionId.length) {
      return
    }
    Clipboard.setString(sessionId)
    Logger.showMessage('session ID copied')
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPressSessionId}>
      <Text style={styles.text}>{sessionId}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 215,
  },
  text: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})
