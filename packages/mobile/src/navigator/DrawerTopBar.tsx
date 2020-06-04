import colorsV2 from '@celo/react-components/styles/colors.v2'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Logo from 'src/icons/Logo.v2'
import Hamburger from 'src/navigator/Hamburger'

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
    ...elevationShadowStyle(1),
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
