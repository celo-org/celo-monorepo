import interpolateColors from '@celo/react-components/components/interpolateColors'
import colors from '@celo/react-components/styles/colors.v2'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated from 'react-native-reanimated'
import Hamburger from 'src/icons/Hamburger'

interface Props {
  middleElement?: React.ReactNode
  scrollPosition?: Animated.Value<number>
  testID?: string
}

function DrawerTopBar({ middleElement, scrollPosition, testID }: Props) {
  const navigation = useNavigation()
  const viewStyle = React.useMemo(
    () => ({
      ...styles.container,
      borderBottomWidth: 1,
      borderBottomColor: interpolateColors(scrollPosition ?? new Animated.Value(0), {
        inputRange: [0, 1],
        outputColorRange: [colors.light, colors.gray2],
      }),
    }),
    [scrollPosition]
  )

  return (
    <Animated.View testID={testID} style={viewStyle}>
      {/*
      // @ts-ignore Only used in a drawer */}
      <TouchableOpacity style={styles.hamburger} onPress={navigation.toggleDrawer}>
        <Hamburger />
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
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'space-between',
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
