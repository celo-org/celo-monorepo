import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { useScreenSize } from 'src/layout/ScreenSize'
import { fonts, standardStyles, textStyles } from 'src/styles'

export default function Poem() {
  const { isDesktop, isTablet } = useScreenSize()
  return (
    <View style={[styles.root, isDesktop && styles.desktopRoot, isTablet && styles.tabletRoot]}>
      <H4 style={[textStyles.italic, standardStyles.elementalMarginBottom]}>For Value Flowers</H4>
      {STANZAS.map((verse) => (
        <Text key={verse.slice(0, 20)} style={fonts.p}>
          {verse}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    zIndex: -5,
  },
  tabletRoot: {
    marginTop: '15vh',
  },
  desktopRoot: {
    marginTop: '20vh',
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
in generous abundance
Our wealth
held, by
humbled enchantments of
Our worth`,
  `
For we believe
in beautiful money
Seeding, with
others, these
New stories
of change
Redeeming systems
beyond exchange`,
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
