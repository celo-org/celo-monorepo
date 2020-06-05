import HamburgerIcon from '@celo/react-components/icons/Hamburger'
import colors from '@celo/react-components/styles/colors.v2'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

interface Props {
  middleElement?: React.ReactNode
  showBottomBorder?: boolean
}

function DrawerTopBar({ middleElement, showBottomBorder }: Props) {
  const navigation = useNavigation()
  return (
    <View
      style={
        showBottomBorder ? { ...styles.container, ...styles.withBorderBottom } : styles.container
      }
    >
      {/*
      // @ts-ignore Only used in a drawer */}
      <TouchableOpacity style={styles.hamburger} onPress={navigation.toggleDrawer}>
        <HamburgerIcon />
      </TouchableOpacity>
      {middleElement}
      <View style={styles.spacer} />
    </View>
  )
}

DrawerTopBar.defaultProps = {
  showLogo: true,
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 62,
    alignItems: 'center',
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  withBorderBottom: {
    borderBottomColor: colors.gray2,
    borderBottomWidth: 1,
  },
  hamburger: {
    padding: 8,
    marginLeft: 4,
    marginBottom: 0,
  },
  spacer: {
    width: 45,
  },
})

export default DrawerTopBar
