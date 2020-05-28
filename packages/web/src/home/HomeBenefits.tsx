import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { H1, H4 } from 'src/fonts/Fonts'
import { NameSpaces, useTranslation } from 'src/i18n'
import expandreachImg from 'src/icons/expand-reach_light-bg.png'
import nonProfitIMG from 'src/icons/non-profit-light-bg.png'
import sendToPhoneImg from 'src/icons/sent-to-phone_light-bg.png'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import menuItems from 'src/shared/menu-items'
import { fonts, standardStyles, textStyles } from 'src/styles'

export default function HomeBenefits() {
  const { t } = useTranslation(NameSpaces.home)
  return (
    <>
      <GridRow
        desktopStyle={standardStyles.blockMarginTop}
        tabletStyle={standardStyles.blockMarginTopTablet}
        mobileStyle={standardStyles.blockMarginTopMobile}
        allStyle={standardStyles.centered}
      >
        <Cell tabletSpan={Spans.twoThird} span={Spans.half}>
          <H4 style={[textStyles.center, standardStyles.elementalMarginTop]}>
            {t('benefitsTitle')}
          </H4>
          <H1 style={[textStyles.center, standardStyles.elementalMarginBottom]}>
            {t('benefitsHeading')}
          </H1>
          <View style={styles.links}>
            <Button
              kind={BTN.NAKED}
              href={'https://medium.com/celoorg/an-introductory-guide-to-celo-b185c62d3067'}
              text={t('readIntroGuide')}
              size={SIZE.normal}
              style={styles.link}
            />
            <Button
              kind={BTN.NAKED}
              href={menuItems.PAPERS.link}
              text={t('whitePaper')}
              size={SIZE.normal}
              style={styles.link}
            />
          </View>
        </Cell>
      </GridRow>
      <GridRow
        allStyle={standardStyles.blockMarginTopMobile}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Prong source={sendToPhoneImg} title={t('benefit1Title')} text={t('benefit1Text')} />
        <Prong source={nonProfitIMG} title={t('benefit2Title')} text={t('benefit2Text')} />
        <Prong source={expandreachImg} title={t('benefit3Title')} text={t('benefit3Text')} />
      </GridRow>
    </>
  )
}

interface Props {
  source: ImageSourcePropType
  title: string
  text: string
}

function Prong({ title, text, source }: Props) {
  return (
    <Cell span={Spans.third}>
      <Image source={source} style={styles.image} resizeMode="contain" />
      <Text style={[fonts.h6, standardStyles.elementalMargin]}>{title}</Text>
      <Text style={fonts.p}>{text}</Text>
    </Cell>
  )
}

const styles = StyleSheet.create({
  links: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
  },
  link: {
    padding: 10,
  },
  image: { width: 100, height: 100 },
})
