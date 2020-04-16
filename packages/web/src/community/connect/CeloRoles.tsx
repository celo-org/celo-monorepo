import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import LottieBase from 'src/animate/LottieBase'
import profiles from 'src/community/lottie/all.json'

export default React.memo(function CeloContributors() {
  return (
    <View style={styles.root}>
      <LottieBase loop={false} data={profiles} />
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: 850,
  },
})
