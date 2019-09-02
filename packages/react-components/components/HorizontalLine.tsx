import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { View } from 'react-native'

function HorizontalLine() {
  return (
    <View
      style={{
        width: '100%',
        borderStyle: 'solid',
        borderTopWidth: 1,
        borderTopColor: colors.darkLightest,
        marginTop: 10,
      }}
    />
  )
}

export default HorizontalLine
