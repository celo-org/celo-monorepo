import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import { useScreenSize } from 'src/layout/ScreenSize'
import { colors, fonts, textStyles } from 'src/styles'

export const WORDS = [
  'finance',
  'saving',
  'education',
  'sending',
  'giving',
  'lending',
  'regeneration',
]

const DURATION = 8510
const START_SLIDE = 600
const SLIDE_IN_DURATION = 2100
const PAUSE = 6600
const SLIDE_IN_START = START_SLIDE / DURATION
const SLIDE_IN_END = (SLIDE_IN_DURATION + START_SLIDE) / DURATION
const FADE_OUT_START = PAUSE / DURATION
const FADE_OUT_STOP = 1

interface Props {
  currentWord: number
  isAnimating: boolean
}

export default React.memo(function TextAnimation({ currentWord, isAnimating }: Props) {
  const { isMobile } = useScreenSize()
  return (
    <View>
      <H1
        ariaLevel={'2'}
        accessibilityRole={'heading'}
        style={[fonts.h1, !isMobile && styles.title, styles.letsMake]}
      >
        A new story in
      </H1>
      <View style={styles.textContainer}>
        {isAnimating && (
          <>
            <View style={[styles.mask, styles.fadeOut]} key={`${currentWord}-mask1`} />
            <View style={[styles.mask2, styles.slideIn]} key={`${currentWord}-mask2`} />
          </>
        )}
        <H1
          ariaLevel={'2'}
          accessibilityRole={'heading'}
          style={[fonts.h1, !isMobile && styles.title, textStyles.medium]}
        >
          {WORDS[currentWord]}
        </H1>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  title: {
    fontSize: 52,
    lineHeight: 58,
  },
  textContainer: {
    display: 'inline-flex',
    width: 'fit-content',
  },
  letsMake: {
    zIndex: 1,
  },
  mask: {
    animationDuration: `${DURATION}ms`,
    height: 56,
    bottom: 0,
    left: 0,
    right: -30,
    top: 8,
    position: 'absolute',
    animationFillMode: 'both',
    animationIterationCount: 1,
    backgroundColor: colors.white,
  },
  mask2: {
    animationDuration: `${DURATION}ms`,
    height: 56,
    bottom: 0,
    left: -20,
    right: 0,
    top: 8,
    position: 'absolute',
    backgroundColor: colors.white,
    animationIterationCount: 1,
  },
  fadeOut: {
    animationKeyframes: [
      {
        '0%': {
          opacity: 0,
        },
        [`${FADE_OUT_START * 100}%`]: {
          opacity: 0,
        },
        [`${FADE_OUT_STOP * 100}%`]: {
          opacity: 1,
        },
        '100%': {
          opacity: 1,
        },
      },
    ],
  },
  slideIn: {
    animationKeyframes: [
      {
        '0%': {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
        [`${SLIDE_IN_START * 100}%`]: {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
        [`${SLIDE_IN_END * 100}%`]: {
          transform: [
            {
              translateX: '100%',
            },
          ],
        },
        '100%': {
          transform: [
            {
              translateX: '100%',
            },
          ],
        },
      },
    ],
  },
})
