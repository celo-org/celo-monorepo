import * as React from 'react'
import { Text, StyleSheet, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { fonts, textStyles, standardStyles } from 'src/styles'
import Fade from 'react-reveal/Fade'
import { useScreenSize } from 'src/layout/ScreenSize'

export default function Poem() {
  const { isDesktop } = useScreenSize()
  return (
    <View style={isDesktop && styles.root}>
      <H4 style={[textStyles.italic, standardStyles.elementalMarginBottom]}>
        <Fade fraction={0.9} bottom={true} duration={2000} delay={300} distance={'20px'}>
          As Wealth Flowers
        </Fade>
      </H4>
      <Text style={fonts.p}>
        {STANZAS.map((verse, i) => (
          <Fade
            fraction={0.85}
            key={i}
            left={i % 2 === 0}
            right={i % 2 === 1}
            duration={2000}
            delay={100}
            distance={'50%'}
          >
            {verse}
          </Fade>
        ))}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    // transform: [{ translateY: -100 }],
  },
})

const STANZAS = [
  `The story is
An invitation, our imagination,
our story, for these
our renewed forms
of prosperity`,
  `
Nourishing, through service
Awakenings of purpose
A magic within connection`,
  `
Gathering, together
in generous abundance,
held, by
humbled enchantments of
Our worth
For we believe
in beautiful money
Seeding, with
others, these
New stories
Of change
Redeeming systems
of exchange`,
  `
Making value beautiful
within hands, within reach
Committed through practice
A divine
gift, deserving
of our acceptance`,
  `
A worthy wish, to serve
A wish
For healing in bloom
A wish
For a responsibility shared
A prayer
For collective prosperity`,
  `
A story,`,
  `
A blossom of beautiful money`,
]
