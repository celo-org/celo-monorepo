import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import * as React from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { ScrollPager } from 'react-native-tab-view'
import { Screens } from 'src/navigator/Screens'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import QRTabBar from 'src/qrcode/QRTabBar'
import { SVG } from 'src/send/actions'

const Tab = createMaterialTopTabNavigator()

const width = Dimensions.get('window').width

function ScannerContainer({ position, ...props }: any) {
  const index = 1
  const length = 2

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

  return (
    // <View style={{ flex: 1, backgroundColor: 'grey' }}>
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateX, scale }] }}>
      <QRScanner {...props} />
    </Animated.View>
    // </View>
  )
}

export default function QRNavigator() {
  const position = React.useRef(new Animated.Value(0)).current
  const qrSvgRef = React.useRef<SVG>()

  // const opacity = Animated.interpolate(position, {
  //   inputRange: [0, 0.5, 1],
  //   outputRange: [1, 0.5, 0.8],
  // })
  // const sceneContainerStyle = { opacity: 0.5 }

  return (
    <Tab.Navigator
      position={position}
      tabBar={(props) => <QRTabBar {...props} qrSvgRef={qrSvgRef} />}
      // Trick to position the tabs floating on top
      tabBarPosition="bottom"
      pager={(props) => <ScrollPager {...props} />}
      style={styles.container}
      sceneContainerStyle={styles.sceneContainerStyle}
    >
      {/* <Tab.Screen name="My Code" component={HomeScreen} />
      <Tab.Screen name="Scan" component={SettingsScreen} /> */}
      <Tab.Screen
        name={Screens.QRCode}
        component={(props) => <QRCode {...props} qrSvgRef={qrSvgRef} />}
      />
      <Tab.Screen
        name={Screens.QRScanner}
        component={(props) => <ScannerContainer {...props} position={position} />}
      />
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
