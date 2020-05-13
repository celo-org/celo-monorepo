import BackChevron from '@celo/react-components/icons/BackChevron.v2'
import colors from '@celo/react-components/styles/colors.v2'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, View } from 'react-native'

type Props = TouchableOpacityProps & {
  height?: number
  color?: string
  testID?: string
}
export default function BackButton({ onPress, color, height, disabled, testID }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        hitSlop={variables.iconHitslop}
        onPress={onPress}
        disabled={disabled}
        testID={testID}
      >
        <BackChevron height={height ? height : SIZE} color={color ? color : colors.greenBrand} />
      </TouchableOpacity>
    </View>
  )
}

const SIZE = 16

const styles = StyleSheet.create({
  container: {
    paddingLeft: variables.contentPadding + 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
