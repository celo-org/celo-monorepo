import SegmentedControl from '@celo/react-components/components/SegmentedControl'
import Share from '@celo/react-components/icons/Share'
import Times from '@celo/react-components/icons/Times'
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { useDispatch } from 'react-redux'
import { TopBarIconButton } from 'src/navigator/TopBarButton.v2'
import { shareQRCode, SVG } from 'src/send/actions'

const HEIGHT = 24

type Props = MaterialTopTabBarProps & {
  qrSvgRef: React.MutableRefObject<SVG>
}

export default function QRTabBar({ state, descriptors, navigation, position, qrSvgRef }: Props) {
  const dispatch = useDispatch()

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

  const values = useMemo(
    () =>
      state.routes.map((route) => {
        const { options } = descriptors[route.key]
        const label = options.title !== undefined ? options.title : route.name
        return label
      }),
    [state, descriptors]
  )

  return (
    <SafeAreaView style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
        <TopBarIconButton icon={<Times />} onPress={onPressClose} />
        <SegmentedControl
          values={values}
          selectedIndex={state.index}
          position={position}
          onChange={onChange}
        />
        <TopBarIconButton icon={<Share />} onPress={onPressShare} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // backgroundColor: 'yellow',
    alignItems: 'center',
    // flex: 1,
  },
})
