import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Flower from 'src/codename-allegory/Flower'
import Poem from 'src/codename-allegory/Poem'
import { useScreenSize } from 'src/layout/ScreenSize'
import RingsGlyph from 'src/logos/RingsGlyph'
import Fade from 'src/shared/Fade'
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

      <View style={styles.footer}>
        <Fade duration={4000} rootMargin={'-35% 0% -25% 0%'} fraction={1}>
          <Text style={[fonts.legal, textStyles.center, standardStyles.elementalMargin]}>
            <RingsGlyph height={15} color={colors.dark} />
            {'  '}
            Imagined with Celo
          </Text>
        </Fade>
        <Fade duration={4000} rootMargin={'-35% 0% -25% 0%'} fraction={1}>
          <Text style={[fonts.legal, textStyles.center]}>Design & Built by cLabs, © Celo 2020</Text>
        </Fade>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: '10%',
    marginBottom: '45vh',
  },
  footer: {
    marginVertical: 30,
  },
  open: {
    height: 'calc(100vh - 50px)',
  },
  mobile: {
    width: '100vw',
    paddingHorizontal: 0,
  },
})
