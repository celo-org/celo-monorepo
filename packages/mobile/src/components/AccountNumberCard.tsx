import Card from '@celo/react-components/components/Card'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { getAddressChunks } from '@celo/utils/src/address'
import React from 'react'
import { StyleSheet, Text } from 'react-native'

interface Props {
  address: string
}

export default function AccountNumberCard({ address }: Props) {
  // Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
  // into 'ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10'
  const addressChunks = ['0x', ...getAddressChunks(address)]
  return (
    <Card style={styles.container} rounded={true}>
      <Text style={[styles.text, styles.topText]}>{addressChunks.slice(0, 6).join(' ')}</Text>
      <Text style={[styles.text, styles.bottomText]}>{addressChunks.slice(6).join(' ')}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 62,
    width: 235,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  text: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  topText: {
    textAlign: 'left',
  },
  bottomText: {
    paddingTop: 4,
    textAlign: 'right',
  },
})
