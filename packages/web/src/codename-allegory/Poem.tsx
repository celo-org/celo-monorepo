import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { useScreenSize } from 'src/layout/ScreenSize'
import Fade from 'src/shared/Fade'
import { fonts, standardStyles, textStyles } from 'src/styles'

export default function Poem() {
  const { isDesktop } = useScreenSize()
  return (
    <View style={isDesktop && styles.root}>
      <Fade duration={2000} rootMargin={'-35% 0% -25% 0%'} fraction={0.75}>
        <H4 style={[textStyles.italic, standardStyles.elementalMarginBottom]}>As Wealth Flowers</H4>
      </Fade>
      {STANZAS.map((verse, i) => (
        <Fade key={i} duration={2000} rootMargin={'-35% 0% -25% 0%'} fraction={0.75}>
          <Text style={fonts.p}>{verse}</Text>
        </Fade>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    marginTop: '30vh',
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
Our worth`,
  `
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
