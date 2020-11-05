import colors from '@celo/react-components/styles/colors'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Hamburger from 'src/icons/Hamburger'

function HamburgerCard() {
  return (
    <View style={styles.container}>
      <Hamburger />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light,
    ...elevationShadowStyle(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    height: 32,
    width: 32,
  },
})

export default React.memo(HamburgerCard)
