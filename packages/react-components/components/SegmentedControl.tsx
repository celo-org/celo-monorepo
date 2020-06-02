import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'

const HEIGHT = 24

interface Props {
  values: string[]
  selectedIndex?: number
  position: Animated.Node<number>
  onChange?: (value: string, selectedIndex: number) => void
}

export default function SegmentedControl({ position, values, selectedIndex = 0, onChange }: Props) {
  const [segmentWidth, setSegmentWidth] = React.useState(0)

  const handleChange = (index: number) => {
    onChange?.(values[index], index)
  }

  const inputRange = values.map((_, i) => i)
  const translateX = Animated.interpolate(position, {
    inputRange,
    outputRange: inputRange.map((i) => i * segmentWidth),
  })

  const onLayout = ({
    nativeEvent: {
      layout: { width },
    },
  }: LayoutChangeEvent) => {
    const newSegmentWidth = values.length ? width / values.length : 0
    if (newSegmentWidth !== segmentWidth) {
      // animation.setValue(newSegmentWidth * (selectedIndex || 0))
      setSegmentWidth(newSegmentWidth)
    }
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {selectedIndex != null && !!segmentWidth && (
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [{ translateX }],
              width: segmentWidth,
            },
          ]}
        />
      )}
      {values.map((value, index) => {
        const isFocused = index === selectedIndex
        return (
          <Touchable
            key={value}
            accessibilityRole="button"
            accessibilityStates={isFocused ? ['selected'] : []}
            // accessibilityLabel={options.tabBarAccessibilityLabel}
            // testID={options.tabBarTestID}
            onPress={() => handleChange(index)}
            // onLongPress={onLongPress}
            style={[styles.value, isFocused && styles.valueSelected]}
          >
            {/* <Animated.Text style={{ opacity }}>{label}</Animated.Text> */}
            <Animated.Text style={[styles.text, isFocused && styles.textSelected /*, { color } */]}>
              {value}
            </Animated.Text>
          </Touchable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: 1,
    borderColor: colors.greenUI,
    overflow: 'hidden',
    //
    marginHorizontal: 30,
  },
  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: colors.greenUI,
  },
  value: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueSelected: {
    // backgroundColor: colors.greenUI,
  },
  text: {
    ...fontStyles.small600,
    fontSize: 12,
    color: colors.greenUI,
  },
  textSelected: {
    color: colors.white,
  },
})
