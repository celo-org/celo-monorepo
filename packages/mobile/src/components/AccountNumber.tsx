import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { getAddressChunks } from '@celo/utils/src/address'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  address: string
}

export default function AccountNumber({ address }: Props) {
  // Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
  // into 'ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10'
  const addressChunks = ['0x', ...getAddressChunks(address)]
  return (
    <View style={styles.container}>
      <Text style={[styles.text, styles.topText]}>{addressChunks.slice(0, 6).join(' ')}</Text>
      <Text style={[styles.text, styles.bottomText]}>{addressChunks.slice(6).join(' ')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 200,
  },
  text: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  topText: {
    textAlign: 'left',
  },
  bottomText: {
    textAlign: 'right',
  },
})
