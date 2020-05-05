import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { colors } from 'src/styles'

interface Props {
  onPress: () => void
  isOpen: boolean
  color: colors
}

const DISTANCE = 5

export default React.memo(function Hamburger(props: Props) {
  const backgroundColor = props.color
  return (
    <TouchableOpacity onPress={props.onPress} style={styles.root}>
      <View
        style={[
          styles.bar,
          props.isOpen
            ? styles.slopeUp
            : { backgroundColor, transform: [{ translateY: -DISTANCE }] },
        ]}
      />
      <View style={[styles.bar, props.isOpen ? styles.invisible : { backgroundColor }]} />
      <View
        style={[
          styles.bar,
          props.isOpen
            ? styles.slopeDown
            : { backgroundColor, transform: [{ translateY: DISTANCE }] },
        ]}
      />
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  root: {
    width: 18,
    height: 12,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  bar: {
    transitionProperty: 'transform color',
    transitionDuration: '120ms',
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
