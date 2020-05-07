import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'

interface Props {
  value: boolean
  onValueChange: (val: boolean) => void
}

function Switch({ value, onValueChange }: Props) {
  const onPress = React.useCallback(() => onValueChange(!value), [value, onValueChange])

  return (
    <>
      <Touchable style={[styles.root, value && styles.on]} borderless={true} onPress={onPress}>
        <View style={styles.nob} />
      </Touchable>
    </>
  )
}

const styles = StyleSheet.create({
  nob: {
    backgroundColor: colors.gray2,
    transform: [{ scale: 2 }],
    width: 10,
    height: 10,
    borderRadius: 20,
    elevation: 1,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.3,
    shadowRadius: 0.8,
  },
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: 4,
    width: 34,
    height: 14,
    borderRadius: 20,
    backgroundColor: colors.gray3,
  },
  on: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.greenUI,
  },
})

export default Switch
