import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import HollowCoin from 'src/shared/HollowOval'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

interface Props {
  term: string
  steps: string[]
}

export default function JourneySteps({ term, steps }: Props) {
  return (
    <View style={[standardStyles.blockMarginTablet, styles.root]}>
      <View style={styles.coinLine}>
        <View style={styles.line} />
        <OvalCoin size={14} color={colors.primary} />
      </View>
      <View style={styles.steps}>
        {steps.map((step, index) => {
          return (
            <View key={step} style={styles.step}>
              <HollowCoin color={colors.primary} size={14} />
              <Text
                style={[
                  fonts.h6,
                  textStyles.center,
                  standardStyles.halfElement,
                  standardStyles.elementalMarginTop,
                ]}
              >
                {term} {index + 1}
              </Text>
              <Text style={[fonts.mini, textStyles.center]}>{step}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    maxWidth: '100%',
  },
  line: {
    top: 5,
    position: 'absolute',
    width: '100%',
    backgroundColor: colors.primary,
    height: 1,
    transform: [{ translateX: -5 }],
  },
  steps: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
  },
  step: {
    flexBasis: 'fit-content',
    minWidth: 80,
    maxWidth: 100,
    marginHorizontal: 10,
    flex: 1,
    alignItems: 'center',
    marginVertical: 15,
  },
  coinLine: {
    overflow: 'visible',
    alignItems: 'flex-end',
    flexBasis: 55,
    marginTop: 15,
  },
})
