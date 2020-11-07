import Card from '@celo/react-components/components/Card'
import React from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import AccountNumber from 'src/components/AccountNumber'

interface Props {
  address: string
  style?: ViewStyle
}

export default function AccountNumberCard({ address, style }: Props) {
  return (
    <Card style={[styles.container, style]} rounded={true}>
      <AccountNumber address={address} touchDisabled={true} />
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
})
