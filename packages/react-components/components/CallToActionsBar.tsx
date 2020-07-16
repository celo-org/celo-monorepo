import TextButton from '@celo/react-components/components/TextButton.v2'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export interface CallToAction {
  onPress: () => unknown
  text: string | JSX.Element
}

interface Props {
  callToActions: CallToAction[]
  testID?: string
}

export default function CallToActionsBar({ callToActions, testID }: Props) {
  return (
    <View style={styles.container} testID={testID}>
      {callToActions.map((cta, i) => {
        if (typeof cta.text === 'string') {
          return (
            <TextButton
              testID={`${testID}/${cta.text}/Button`}
              key={i}
              style={styles.action}
              onPress={cta.onPress}
            >
              {cta.text}
            </TextButton>
          )
        }
        return (
          <View key={i} style={styles.action}>
            {cta.text}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  action: {
    fontSize: 14,
    lineHeight: 16,
    marginRight: 24,
    minWidth: 48,
    height: 16,
  },
})
