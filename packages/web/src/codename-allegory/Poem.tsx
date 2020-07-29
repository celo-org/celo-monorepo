import * as React from 'react'
import { Text, StyleSheet, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { fonts, textStyles, standardStyles } from 'src/styles'
import Fade from 'react-reveal/Fade'

export default function Poem() {
  return (
    <View style={styles.root}>
      <H4 style={[textStyles.italic, standardStyles.elementalMarginBottom]}>As Wealth Flowers</H4>
      <Text style={fonts.p}>
        {STANZAS.map((verse) => (
          <Fade bottom={true} duration={1800} delay={200} distance={'20px'}>
            {verse}{' '}
          </Fade>
        ))}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {},
})

const STANZAS = [
  `The story is
An invitation, our imagination,
our story, for these
our renewed forms
of prosperity`,
  `Nourishing, through service
Awakenings of purpose
A magic within connection`,
  `Gathering, together
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
  `Making value beautiful
within hands, within reach
Committed through practice
A divine
gift, deserving
of our acceptance`,
  `A worthy wish, to serve
A wish
For healing in bloom
A wish
For a responsibility shared
A prayer
For collective prosperity`,
  `A story,`,
  `A blossom of beautiful money`,
]
