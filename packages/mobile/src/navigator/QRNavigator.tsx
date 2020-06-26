import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs'
import { useIsFocused } from '@react-navigation/native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native'
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions'
import Animated, { call, greaterThan, onChange } from 'react-native-reanimated'
import { ScrollPager } from 'react-native-tab-view'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import QRTabBar from 'src/qrcode/QRTabBar'
import { SVG } from 'src/send/actions'
import { ExtractProps } from 'src/utils/typescript'

const Tab = createMaterialTopTabNavigator()

const width = Dimensions.get('window').width
const initialLayout = { width }

type AnimatedScannerSceneProps = ExtractProps<typeof QRScanner> & {
  position: Animated.Value<number>
}

// Component doing our custom transition for the QR scanner
function AnimatedScannerScene({ position, ...props }: AnimatedScannerSceneProps) {
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
          setIsPartiallyVisible(value > 0)
        })
      ),
    [position]
  )

  const animatedStyle = useMemo(() => {
    const opacity = Animated.interpolate(position, {
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    const translateX = Animated.interpolate(position, {
      inputRange: [0, 1],
      outputRange: [-width, 0],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    const scale = Animated.interpolate(position, {
      inputRange: [0, 1],
      outputRange: [0.7, 1],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    return { flex: 1, opacity, transform: [{ translateX, scale }] }
  }, [position])

  // This only enables the camera when necessary.
  // There a special treatment for when we haven't asked the user for camera permission yet.
  // In that case we want to wait for the screen to be fully focused before enabling the camera so the
  // prompt doesn't show up in the middle of the slide animation.
  // Indeed, enabling the camera directly triggers the permission prompt with the current version of
  // react-native-camera.
  const enableCamera = isFocused || (isPartiallyVisible && (hasAskedCameraPermission || wasFocused))

  return (
    <Animated.View style={animatedStyle}>
      {isFocused && <StatusBar barStyle="light-content" backgroundColor="black" />}
      {enableCamera && <QRScanner {...props} />}
    </Animated.View>
  )
}

// Use ScrollPager on iOS as it gives a better native feeling
const pager: ExtractProps<typeof Tab.Navigator>['pager'] =
  Platform.OS === 'ios' ? (props) => <ScrollPager {...props} /> : undefined

export default function QRNavigator() {
  const position = useRef(new Animated.Value(0)).current
  const qrSvgRef = useRef<SVG>()
  const { t } = useTranslation(Namespaces.sendFlow7)

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
      <Tab.Screen name={Screens.QRCode} options={{ title: t('myCode') }}>
        {(props) => <QRCode {...props} qrSvgRef={qrSvgRef} />}
      </Tab.Screen>
      <Tab.Screen name={Screens.QRScanner} options={{ title: t('scanCode') }}>
        {(props) => <AnimatedScannerScene {...props} position={position} />}
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
