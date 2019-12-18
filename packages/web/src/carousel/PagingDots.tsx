import { CarouselSlideRenderControlProps } from 'nuka-carousel'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { colors } from 'src/styles'

export default function PagingDots(props: CarouselSlideRenderControlProps) {
  return (
    <View style={styles.dotContainer}>
      {Array(props.slideCount)
        .fill(null)
        .map((_, index) => {
          const slideNumber = index
          const goToSlide = () => props.goToSlide(slideNumber)
          const isActive = props.currentSlide === slideNumber
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              key={index}
              style={[styles.dot, isActive ? styles.active : styles.inactive]}
              onPress={goToSlide}
            />
          )
        })}
    </View>
  )
}

const DOT_SIZE = 13
const styles = StyleSheet.create({
  tenet: {
    marginBottom: 100,
  },
  tabletStyle: {
    marginHorizontal: 15,
  },
  dotContainer: {
    flexDirection: 'row',
  },
  dot: {
    margin: DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  inactive: {
    backgroundColor: 'transparent',
  },
  active: { backgroundColor: colors.primary },
})
