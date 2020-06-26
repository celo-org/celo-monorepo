import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'

interface Props {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  testID?: string
}

export default function ListItem({ children, onPress, disabled, testID }: Props) {
  return (
    <View style={styles.container}>
      {onPress ? (
        <Touchable onPress={onPress} borderless={true} disabled={disabled} testID={testID}>
          <View style={styles.innerView}>{children}</View>
        </Touchable>
      ) : (
        <View style={styles.innerView}>{children}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  innerView: {
    paddingVertical: variables.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
    marginLeft: variables.contentPadding,
  },
})
