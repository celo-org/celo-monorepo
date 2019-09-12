import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  words: string | null
  label?: string
}

export default function BackupPhraseContainer(props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.labelText}>{props.label}</Text>
      {!!props.words && (
        <View style={styles.phraseContainer}>
          <Text style={styles.phraseText}>{`${props.words}`}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },
  phraseContainer: {
    position: 'relative',
    backgroundColor: colors.altDarkBg,
    alignContent: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 4,
  },
  phraseText: {
    ...fontStyles.h2,
    textAlign: 'left',
  },
  labelText: {
    ...fontStyles.body,
    fontSize: 16,
    textAlign: 'left',
    paddingTop: 15,
  },
})
