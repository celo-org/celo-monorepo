import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  words: string | null
}

export default function BackupPhraseContainer(props: Props) {
  return (
    <View style={styles.phraseContainer}>
      <Text style={styles.phraseText}>{`${props.words}`}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  phraseContainer: {
    position: 'relative',
    backgroundColor: colors.altDarkBg,
    alignContent: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 30,
  },
  phraseText: {
    ...fontStyles.h2,
    textAlign: 'left',
  },
})
