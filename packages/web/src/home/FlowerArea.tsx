import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { H2, H4 } from 'src/fonts/Fonts'
import MistFlowerMobile from 'src/home/mist-flower-mobile.jpg'
import MistFlower from 'src/home/mist-flower.jpg'
import { useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import Fade from 'src/shared/AwesomeFade'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import pagePaths, { CeloLinks } from 'src/shared/menu-items'
import { standardStyles, textStyles } from 'src/styles'

export default function FlowerArea() {
  const [t] = useTranslation('home')
  const { isMobile } = useScreenSize()
  return (
    <GridRow
      desktopStyle={standardStyles.sectionMarginBottom}
      tabletStyle={standardStyles.sectionMarginBottomTablet}
      mobileStyle={[standardStyles.sectionMarginBottomMobile, styles.noPad]}
    >
      <Cell span={Spans.full} style={styles.noPad}>
        <Fade distance="30px" duration={800}>
          <AspectRatio ratio={isMobile ? 1 : 937 / 526}>
            <Image source={isMobile ? MistFlowerMobile : MistFlower} style={standardStyles.image} />
          </AspectRatio>
        </Fade>
        <View style={[standardStyles.centered, isMobile && styles.content]}>
          <H2
            style={[
              textStyles.center,
              isMobile && standardStyles.halfElement,
              standardStyles.elementalMarginTop,
            ]}
          >
            {isMobile ? t('flowersTitleMobile') : t('flowersTitle')}
          </H2>
          <H4 style={[textStyles.center, standardStyles.elementalMarginBottom]}>
            {t('flowersSubtitle')}
          </H4>
          <View style={standardStyles.row}>
            <Button
              text={t('flowersButton')}
              style={styles.kuneco}
              href={pagePaths.FLOWERS.link}
              kind={BTN.NAKED}
              size={SIZE.normal}
              target={'_blank'}
            />
            <Button
              text={'Kuneco'}
              href={CeloLinks.kuneco}
              kind={BTN.NAKED}
              size={SIZE.normal}
              target={'_blank'}
            />
          </View>
        </View>
      </Cell>
    </GridRow>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24 },
  noPad: { paddingHorizontal: 0 },
  kuneco: { marginRight: 30 },
})
