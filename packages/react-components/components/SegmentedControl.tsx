import interpolateColors from '@celo/react-components/components/interpolateColors'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import MaskedView from '@react-native-community/masked-view'
import React from 'react'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
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

  // TODO: color should be dependant on the style for the value
  // here it's assuming value at index 0 is green and index 1 (or above) is white
  const color = interpolateColors(position, {
    inputRange: [0.5, 1],
    outputColorRange: [colors.greenUI, colors.white],
  })

  const colorInverted = interpolateColors(position, {
    inputRange: [0.5, 1],
    outputColorRange: [colors.white, colors.dark],
  })

  const onLayout = ({
    nativeEvent: {
      layout: { width },
    },
  }: LayoutChangeEvent) => {
    const newSegmentWidth = values.length ? width / values.length : 0
    if (newSegmentWidth !== segmentWidth) {
      setSegmentWidth(newSegmentWidth)
    }
  }

  return (
    <Animated.View style={[styles.container, { borderColor: color }]} onLayout={onLayout}>
      {selectedIndex != null && !!segmentWidth && (
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [{ translateX }],
              width: segmentWidth,
              backgroundColor: color,
            },
          ]}
        />
      )}
      <MaskedView
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
        maskElement={
          <View style={styles.maskedContainer}>
            {values.map((value, index) => {
              return (
                <View key={value} style={styles.value}>
                  <Text style={styles.text}>{value}</Text>
                </View>
              )
            })}
          </View>
        }
      >
        {/* Shows behind the mask, i.e. inside the text */}
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: color }} />
        {selectedIndex != null && !!segmentWidth && (
          <Animated.View
            style={[
              styles.slider,
              {
                transform: [{ translateX }],
                width: segmentWidth,
                backgroundColor: colorInverted,
              },
            ]}
          />
        )}
      </MaskedView>
      {values.map((value, index) => {
        const isFocused = index === selectedIndex
        const onPress = () => handleChange(index)
        return (
          <Touchable
            key={value}
            accessibilityRole="button"
            accessibilityStates={isFocused ? ['selected'] : []}
            accessibilityLabel={value}
            onPress={onPress}
            style={styles.value}
          >
            <View />
          </Touchable>
        )
      })}
    </Animated.View>
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
  maskedContainer: {
    // Transparent background because mask is based off alpha channel.
    backgroundColor: 'transparent',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...fontStyles.small600,
    fontSize: 12,
    color: colors.greenUI,
  },
})
