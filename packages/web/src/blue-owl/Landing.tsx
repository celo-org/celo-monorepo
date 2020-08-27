import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Cover from 'src/blue-owl/Cover'
import OpenGraph from 'src/header/OpenGraph'
import { H1, H4 } from 'src/fonts/Fonts'
import { NameSpaces, useTranslation } from 'src/i18n'
import pagePaths from 'src/shared/menu-items'
import valora from 'src/icons/valora-icon.png'
import nonProfitIMG from 'src/icons/non-profit-light-bg.png'
import sendToPhoneImg from 'src/icons/sent-to-phone_light-bg.png'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
// import menuItems from 'src/shared/menu-items'
import sequenceTopImage from 'src/illustrations/03-Inclusive-money-(light-bg).png'
import { standardStyles, textStyles, colors, fonts } from 'src/styles'
import { Adventure } from 'src/home/Adventure'
import { useScreenSize } from 'src/layout/ScreenSize'

export default function Landing() {
  const [t] = useTranslation(NameSpaces.cbe)
  const { isMobile, isDesktop } = useScreenSize()
  return (
    <View style={styles.root}>
      <OpenGraph title={t('pageTitle')} description={t('description')} path={pagePaths.CBE.link} />
      <Cover />
      <GridRow
        desktopStyle={standardStyles.blockMarginTop}
        tabletStyle={standardStyles.blockMarginTopTablet}
        mobileStyle={standardStyles.elementalMarginTop}
        allStyle={standardStyles.centered}
      >
        <Cell tabletSpan={Spans.full} span={Spans.full}>
          <H4 style={!isMobile && [textStyles.center, standardStyles.elementalMarginBottom]}>
            {t('subTitle')}
          </H4>
          <H1
            style={
              isMobile
                ? [fonts.h1, { marginTop: 5 }]
                : [textStyles.center, standardStyles.elementalMarginBottom]
            }
          >
            {t('mainTitle')}
          </H1>
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.blockMarginBottom}
        tabletStyle={standardStyles.blockMarginBottomTablet}
        mobileStyle={standardStyles.blockMarginBottomMobile}
      >
        <Adventure
          source={sendToPhoneImg}
          title={t('adventure1.title')}
          text={t('adventure1.text')}
          link={{ href: 'https://valoraapp.co/3j0mTjS', text: t('adventure1.link') }}
        />
        <Adventure
          source={nonProfitIMG}
          title={t('adventure2.title')}
          text={t('adventure2.text')}
          link={{ href: 'https://valoraapp.co/3l5XLtC', text: t('adventure2.link') }}
        />
        <Adventure
          source={valora}
          title={t('adventure3.title')}
          text={t('adventure3.text')}
          link={{ href: 'https://valoraapp.com', text: t('adventure3.link') }}
          imageStyle={isDesktop ? styles.valoraDesktop : styles.valora}
        />
      </GridRow>
      <GridRow allStyle={standardStyles.elementalMarginBottom}>
        <Cell span={Spans.full} style={!isMobile && standardStyles.centered}>
          <Image source={sequenceTopImage} style={styles.logo} resizeMode="contain" />
          <H4>{t('sequenceTitle')}</H4>
        </Cell>
      </GridRow>
      <GridRow>
        <ContentPreview title={t('lesson1')} time={'2 min'} />
        <ContentPreview title={t('lesson2')} time={'5 min'} />
        <ContentPreview title={t('lesson3')} time={'3 min'} />
      </GridRow>
    </View>
  )
}

interface ContentPreviewProps {
  title: string
  time: string
}

function ContentPreview({ title, time }: ContentPreviewProps) {
  return (
    <Cell span={Spans.third}>
      <Image style={styles.preview} source={sequenceTopImage} />
      <Text style={fonts.h6}>{title}</Text>
      <Text style={[fonts.h6, styles.minutes]}>{time}</Text>
    </Cell>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  preview: { backgroundColor: colors.gray, height: 222, marginBottom: 10 },
  logo: { width: 275, height: 75, backgroundColor: colors.lightBlue },
  valora: { height: 70, width: 70 },
  valoraDesktop: { marginTop: 30, height: 70, width: 70 },
  minutes: { color: colors.grayHeavy, marginTop: 2 },
})
