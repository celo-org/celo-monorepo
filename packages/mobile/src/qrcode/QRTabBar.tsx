import interpolateColors from '@celo/react-components/components/interpolateColors'
import SegmentedControl from '@celo/react-components/components/SegmentedControl'
import Share from '@celo/react-components/icons/Share'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors.v2'
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import SafeAreaView from 'react-native-safe-area-view'
import { useDispatch } from 'react-redux'
import { TopBarIconButton } from 'src/navigator/TopBarButton.v2'
import { shareQRCode, SVG } from 'src/send/actions'

type Props = MaterialTopTabBarProps & {
  qrSvgRef: React.MutableRefObject<SVG>
}

export default function QRTabBar({ state, descriptors, navigation, position, qrSvgRef }: Props) {
  const dispatch = useDispatch()

  const values = useMemo(
    () =>
      state.routes.map((route) => {
        const { options } = descriptors[route.key]
        const label = options.title !== undefined ? options.title : route.name
        return label
      }),
    [state, descriptors]
  )

  const shareOpacity = Animated.interpolate(position, {
    inputRange: [0, 0.1],
    outputRange: [1, 0],
  })

  const color = interpolateColors(position, {
    inputRange: [0.9, 1],
    outputColorRange: [colors.dark, colors.white],
  })

  const onPressClose = () => {
    navigation.dangerouslyGetParent()?.goBack()
  }

  const onPressShare = () => {
    dispatch(shareQRCode(qrSvgRef.current))
  }

  const onChange = (value: string, index: number) => {
    const route = state.routes[index]
    const isFocused = index === state.index

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    })

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name)
    }
  }

  return (
    <SafeAreaView style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          <TopBarIconButton icon={<Times color={color} />} onPress={onPressClose} />
        </View>
        <SegmentedControl
          values={values}
          selectedIndex={state.index}
          position={position}
          onChange={onChange}
        />
        <Animated.View
          style={[styles.rightContainer, { opacity: shareOpacity }]}
          pointerEvents={state.index > 0 ? 'none' : undefined}
        >
          <TopBarIconButton icon={<Share />} onPress={onPressShare} />
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  leftContainer: {
    width: 50,
    alignItems: 'center',
  },
  rightContainer: {
    width: 50,
    alignItems: 'center',
  },
})
