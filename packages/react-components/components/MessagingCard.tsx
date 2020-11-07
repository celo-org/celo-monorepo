import Card, { Props } from '@celo/react-components/components/Card'
import React from 'react'
import { StyleSheet } from 'react-native'

// Card used by all messaging cards
export default function MessagingCard({ style, ...props }: Props) {
  return <Card style={[styles.container, style]} rounded={true} {...props} />
}

const styles = StyleSheet.create({
  container: {
    height: 144,
  },
})
