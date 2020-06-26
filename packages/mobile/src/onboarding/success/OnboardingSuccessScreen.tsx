import colors from '@celo/react-components/styles/colors'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import DancingRings from 'src/icons/DancingRings'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers.v2'
import { navigateHome } from 'src/navigator/NavigationService'

function OnboardingSuccessScreen() {
  return (
    <View style={styles.container}>
      <DancingRings onAnimationFinish={navigateHome} />
    </View>
  )
}

OnboardingSuccessScreen.navigationOptions = nuxNavigationOptionsNoBackButton

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default OnboardingSuccessScreen
