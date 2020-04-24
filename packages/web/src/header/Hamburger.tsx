import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { colors } from 'src/styles'

interface Props {
  onPress: () => void
  isOpen: boolean
  color: colors
}

export default React.memo(function Hamburger(props: Props) {
  const backgroundColor = props.color
  return (
    <TouchableOpacity onPress={props.onPress} style={styles.root}>
      <View
        style={[
          styles.bar,
          props.isOpen ? styles.slopeUp : { backgroundColor, transform: [{ translateY: -5 }] },
        ]}
      />
      <View style={[styles.bar, props.isOpen ? styles.invisible : { backgroundColor }]} />
      <View
        style={[
          styles.bar,
          props.isOpen ? styles.slopeDown : { backgroundColor, transform: [{ translateY: 5 }] },
        ]}
      />
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  root: {
    width: 18,
    height: 12,
    marginHorizontal: 18,
    marginVertical: 15,
  },
  bar: {
    transitionProperty: 'transform',
    transitionDuration: '150ms',
    position: 'absolute',
    marginVertical: 2,
    height: 2,
    width: 18,
    backgroundColor: colors.dark,
  },
  slopeUp: {
    transform: [{ rotate: '45deg' }],
  },
  slopeDown: {
    transform: [{ rotate: '-45deg' }],
  },
  invisible: {
    opacity: 0,
  },
})
