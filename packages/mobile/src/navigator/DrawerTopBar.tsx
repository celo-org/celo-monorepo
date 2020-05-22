import colorsV2 from '@celo/react-components/styles/colors.v2'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Line, Svg } from 'react-native-svg'
import Logo from 'src/icons/Logo.v2'

const Hamburger = () => {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <Line
        x1="7.25"
        y1="9.75"
        x2="24.75"
        y2="9.75"
        stroke="#2E3338"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Line
        x1="7.25"
        y1="15.75"
        x2="24.75"
        y2="15.75"
        stroke="#2E3338"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Line
        x1="7.25"
        y1="21.75"
        x2="24.75"
        y2="21.75"
        stroke="#2E3338"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

const DrawerTopBar = () => {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
      {/*
      // @ts-ignore Only used in a drawer */}
      <TouchableOpacity style={styles.hamburger} onPress={navigation.toggleDrawer}>
        <Hamburger />
      </TouchableOpacity>
      <View style={styles.logo}>
        <Logo />
      </View>
      <View style={styles.spacer} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 62,
    backgroundColor: colorsV2.white,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colorsV2.gray2,
  },
  hamburger: {
    padding: 8,
    marginLeft: 4,
    marginBottom: 0,
  },
  logo: {
    marginBottom: 13,
  },
  spacer: {
    width: 45,
  },
})

export default DrawerTopBar
