import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { trimLeading0x } from '@celo/utils/src/address'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  address: string
}

export default function AccountNumber({ address }: Props) {
  const formattedAddress = (trimLeading0x(address).match(/.{1,4}/g) || []).join(' ')
  return (
    <View style={styles.container}>
      <Text style={styles.text}>0x </Text>
      <Text style={styles.text}>{formattedAddress}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  text: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})
