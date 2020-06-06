import colors from '@celo/react-components/styles/colors'
import React, { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import DancingRings from 'src/icons/DancingRings'
import { navigateHome } from 'src/navigator/NavigationService'

function OnboardingSuccessScreen() {
  const onAnimationFinish = useCallback(() => {
    navigateHome()
  }, [])

  return (
    <View style={styles.container}>
      <DancingRings onAnimationFinish={onAnimationFinish} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default React.memo(OnboardingSuccessScreen)
