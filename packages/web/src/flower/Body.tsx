import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Abundance from 'src/flower/community-abundance.png'
import Flower from 'src/flower/Flower'
import Poem from 'src/flower/Poem'
import { useScreenSize } from 'src/layout/ScreenSize'
import RingsGlyph from 'src/logos/RingsGlyph'
import Fade from 'src/shared/Fade'
import { colors, fonts, textStyles } from 'src/styles'

interface Props {
  isOpen: boolean
}

export default React.memo(function Body({ isOpen }: Props) {
  const { isMobile } = useScreenSize()

  return (
    <View style={[styles.root, isMobile && styles.mobile, isMobile && isOpen && styles.open]}>
      <Fade duration={1500} rootMargin={'-15%'} fraction={1}>
        <RingsGlyph color={colors.dark} height={30} />
      </Fade>
      <Flower />
      <View style={styles.mist} />
      <Poem />

      <View style={styles.footer}>
        <View>
          <Fade duration={2000} fraction={1} rootMargin={'-5% 0% -20%'} style={styles.imagine}>
            <Image source={Abundance} style={styles.abundance} />
          </Fade>
          <Fade duration={5000} fraction={1} rootMargin={'-20% 0% -30%'}>
            <Text style={[fonts.p, textStyles.center, textStyles.italic]}>
              – Imagined with Celo
            </Text>
          </Fade>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    paddingTop: '15vh',
  },
  abundance: { width: 196, height: 200 },
  footer: {
    zIndex: -10,
    marginBottom: 30,
    height: '100vh',
    justifyContent: 'center',
  },
  open: {
    transitionDelay: '0ms',
    opacity: 0,
    height: 'calc(100vh - 50px)',
  },
  mobile: {
    transitionDelay: '600ms',
    transitionDuration: '800ms',
    transitionProperty: 'opacity',
    width: '100vw',
    paddingHorizontal: 0,
    paddingTop: '10vh',
  },
  imagine: { marginVertical: 15 },
  mist: {
    zIndex: -2,
    position: 'fixed',
    boxShadow: 'inset 0px 0px 8vh 15vh rgba(255,255,255,1)',
    width: '100%',
    transform: [{ scaleX: 2 }],
    bottom: 0,
    top: 0,
  },
})
