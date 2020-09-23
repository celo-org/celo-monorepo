import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Flower from 'src/codename-allegory/Flower'
import Poem from 'src/codename-allegory/Poem'
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
        <Fade duration={2100} rootMargin={'-35% 0% -45% 0%'} fraction={1} style={styles.imagine}>
          <Text style={[fonts.legal, textStyles.center]}>
            <RingsGlyph height={15} color={colors.dark} />
            {'  '}
            Imagined with Celo
          </Text>
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
    paddingTop: '15vh',
    marginBottom: '45vh',
  },
  footer: {
    marginVertical: 30,
  },
  open: {
    opacity: 0,
    height: 'calc(100vh - 50px)',
  },
  mobile: {
    transitionDuration: '700ms',
    transitionProperty: 'opacity',
    width: '100vw',
    paddingHorizontal: 0,
    paddingTop: '10vh',
  },
  imagine: { marginTop: '45vh' },
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
