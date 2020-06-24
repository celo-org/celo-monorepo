import TextButton from '@celo/react-components/components/TextButton'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface SendCTAProps {
  icon: React.ReactElement
  header: string
  body: string
  cta: string
  onPressCta: () => void
}

// A CTA 'card' embedded in the Send screen list
export function SendCallToAction(props: SendCTAProps) {
  return (
    <View style={styles.container}>
      {props.icon}
      <View style={styles.textContainer}>
        <Text style={fontStyles.bodySmallSemiBold}>{props.header}</Text>
        <Text style={styles.bodyText}>{props.body}</Text>
        <TextButton onPress={props.onPressCta}>{props.cta}</TextButton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  bodyText: {
    ...fontStyles.bodySmall,
    marginVertical: 10,
  },
})
