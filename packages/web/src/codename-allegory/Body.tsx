import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Flower from 'src/codename-allegory/Flower'
import Poem from 'src/codename-allegory/Poem'
import { useScreenSize } from 'src/layout/ScreenSize'
import RingsGlyph from 'src/logos/RingsGlyph'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

interface Props {
  isOpen: boolean
}

export default React.memo(function Body({ isOpen }: Props) {
  const { isMobile } = useScreenSize()

  return (
    <View style={[styles.root, isMobile && styles.mobile, isMobile && isOpen && styles.open]}>
      <RingsGlyph color={colors.dark} height={30} />
      <Flower />
      <Poem />
      <Fade duration={1800} delay={1200}>
        <View style={styles.footer}>
          <Text style={[fonts.legal, textStyles.center, standardStyles.elementalMargin]}>
            <RingsGlyph height={15} color={colors.dark} />
            {'  '}
            Imagined with Celo
          </Text>
          <Text style={[fonts.legal, textStyles.center]}>Design & Built by cLabs, © Celo 2020</Text>
        </View>
      </Fade>
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: '10%',
  },
  footer: {
    marginVertical: 30,
  },
  open: {
    height: 'calc(100vh - 50px)',
  },
  mobile: {
    width: '100vw',
  },
})
