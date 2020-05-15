import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import LottieBase from 'src/animate/LottieBase'
import ChangeStoryJSON from 'src/home/change-story/animation.json'

export default React.memo(function ChangeStory() {
  return (
    <View accessibilityLabel="changeStory-animation" style={styles.root}>
      <LottieBase loop={true} data={ChangeStoryJSON} />
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
  },
})
