import DownArrowIcon from '@celo/react-components/icons/DownArrowIcon'
import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, ViewStyle } from 'react-native'

interface Props {
  isExpandable: boolean
  isExpanded: boolean
  containerStyle?: ViewStyle
  children?: React.ReactNode
}

export default function Expandable({ isExpandable, isExpanded, containerStyle, children }: Props) {
  const anim = useRef(new Animated.Value(0)).current
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current === true) {
      firstRun.current = false
      return
    }
    Animated.spring(anim, {
      toValue: isExpanded ? 1 : 0,
      overshootClamping: true,
      useNativeDriver: true,
    }).start()
  }, [isExpanded])

  const arrowRotation = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  return (
    <View style={[styles.container, containerStyle]}>
      {children}
      {isExpandable && (
        <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
          <DownArrowIcon />
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
