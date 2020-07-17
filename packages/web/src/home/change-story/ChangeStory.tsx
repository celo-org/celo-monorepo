import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import LottieBase from 'src/animate/LottieBase'
import ChangeStoryJSON from 'src/home/change-story/animation.json'

interface Props {
  onReady: () => void
  onLooped: () => void
}

export default React.memo(function ChangeStory({ onReady, onLooped }: Props) {
  return (
    <View accessibilityLabel="changeStory-animation" style={styles.root}>
      <LottieBase
        loop={true}
        data={ChangeStoryJSON}
        onReady={onReady}
        autoPlay={true}
        onLooped={onLooped}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
  },
})
