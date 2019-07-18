import * as React from 'react'
import { createElement, StyleSheet, View, ViewStyle } from 'react-native'

interface Props {
  onLayout?: () => void
  ratio: number
  style?: ViewStyle | ViewStyle[]
}

export default class AspectRatio extends React.Component<Props> {
  render() {
    const { children, onLayout, ratio, style } = this.props
    const percentage = 100 / ratio

    return (
      <View onLayout={onLayout} style={[styles.root, style]}>
        {createElement('div', {
          style: [styles.ratio, { paddingBottom: `${percentage}%` }],
        })}
        {createElement('div', {
          children,
          style: styles.content,
        })}
      </View>
    )
  }
}

// @ts-ignore
const styles = StyleSheet.create({
  root: {
    // @ts-ignore
    display: 'block',
    overflow: 'hidden',
  },
  ratio: {
    // @ts-ignore
    display: 'block',
    width: '100%',
  },
  content: {
    bottom: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
})
