import HamburgerIcon from '@celo/react-components/icons/Hamburger'
import colors from '@celo/react-components/styles/colors.v2'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, { cond, greaterThan } from 'react-native-reanimated'

interface Props {
  middleElement?: React.ReactNode
  scrollPosition?: Animated.Value<number>
}

function DrawerTopBar({ middleElement, scrollPosition }: Props) {
  const navigation = useNavigation()
  const viewStyle = React.useMemo(
    () => ({
      ...styles.container,
      borderBottomColor: colors.gray2,
      borderBottomWidth: cond(greaterThan(scrollPosition ?? new Animated.Value(0), 0), 1, 0),
    }),
    [scrollPosition]
  )

  return (
    <Animated.View style={viewStyle}>
      {/*
      // @ts-ignore Only used in a drawer */}
      <TouchableOpacity style={styles.hamburger} onPress={navigation.toggleDrawer}>
        <HamburgerIcon />
      </TouchableOpacity>
      {middleElement}
      <View style={styles.spacer} />
    </Animated.View>
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
