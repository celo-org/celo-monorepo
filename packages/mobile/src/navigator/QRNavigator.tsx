import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs'
import { useIsFocused } from '@react-navigation/native'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Dimensions, Platform, StyleSheet } from 'react-native'
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions'
import Animated, { call, greaterThan, onChange } from 'react-native-reanimated'
import { ScrollPager } from 'react-native-tab-view'
import { Screens } from 'src/navigator/Screens'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import QRTabBar from 'src/qrcode/QRTabBar'
import { SVG } from 'src/send/actions'

const Tab = createMaterialTopTabNavigator()

const width = Dimensions.get('window').width
const initialLayout = { width }

function ScannerContainer({ position, ...props }: any) {
  const index = 1
  const length = 2

  const isFocused = useIsFocused()
  const [wasFocused, setWasFocused] = useState(isFocused)
  const [isPartiallyVisible, setIsPartiallyVisible] = useState(false)
  const cameraPermission = useAsync(check, [
    Platform.select({ ios: PERMISSIONS.IOS.CAMERA, default: PERMISSIONS.ANDROID.CAMERA }),
  ])
  // DENIED means the permission has not been requested / is denied but requestable
  const hasAskedCameraPermission =
    cameraPermission.result !== undefined && cameraPermission.result !== RESULTS.DENIED

  useEffect(() => {
    if (isFocused && !wasFocused) {
      setWasFocused(true)
    }
  }, [isFocused])

  Animated.useCode(
    () =>
      onChange(
        greaterThan(position, 0),
        call([position], ([value]) => {
          // console.log('==value', value)
          setIsPartiallyVisible(value > 0)
        })
      ),
    [position]
  )

  const opacity = Animated.interpolate(position, {
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const inputRange = Array.from({ length }, (_, i) => i)
  const translateOutputRange = inputRange.map((i) => {
    return width * (index - i) * -1
  })

  // const translateX = Animated.interpolate(position, {
  //   inputRange: [0, 1, 2],
  //   outputRange: [0.7, 1, 0.7],
  // })

  const translateX = Animated.interpolate(position, {
    inputRange,
    outputRange: translateOutputRange,
    extrapolate: Animated.Extrapolate.CLAMP,
  })

  const scale = Animated.interpolate(position, {
    inputRange: [0, 1, 2],
    outputRange: [0.7, 1, 1],
  })

  // This only enables the camera when necessary.
  // There a special treatment for when we haven't asked the user for camera permission yet.
  // In that case we want to wait for the screen to be fully focused before enabling the camera so the
  // prompt doesn't show up in the middle of the slide animation.
  // Indeed, enabling the camera directly triggers the permission prompt with the current version of
  // react-native-camera.
  const enableCamera = isFocused || (isPartiallyVisible && (hasAskedCameraPermission || wasFocused))

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateX, scale }] }}>
      <QRScanner {...props} enableCamera={enableCamera} />
    </Animated.View>
  )
}

// Use ScrollPager on iOS as it gives a better native feeling
const pager: React.ComponentProps<typeof Tab.Navigator>['pager'] =
  Platform.OS === 'ios' ? (props) => <ScrollPager {...props} /> : undefined

export default function QRNavigator() {
  const position = React.useRef(new Animated.Value(0)).current
  const qrSvgRef = React.useRef<SVG>()

  const tabBar = (props: MaterialTopTabBarProps) => <QRTabBar {...props} qrSvgRef={qrSvgRef} />

  return (
    <Tab.Navigator
      position={position}
      tabBar={tabBar}
      // Trick to position the tabs floating on top
      tabBarPosition="bottom"
      pager={pager}
      style={styles.container}
      sceneContainerStyle={styles.sceneContainerStyle}
      initialLayout={initialLayout}
    >
      <Tab.Screen name={Screens.QRCode} options={{ title: 'My Code' }}>
        {(props) => <QRCode {...props} qrSvgRef={qrSvgRef} />}
      </Tab.Screen>
      <Tab.Screen name={Screens.QRScanner} options={{ title: 'Scan' }}>
        {(props) => <ScannerContainer {...props} position={position} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
  },
  sceneContainerStyle: {
    backgroundColor: 'black',
  },
})
