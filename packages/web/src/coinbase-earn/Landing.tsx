import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import Cover from 'src/coinbase-earn/Cover'
import learnLogo from 'src/coinbase-earn/Learn_Light.png'
import lesson1Image from 'src/coinbase-earn/lesson1.jpg'
import lesson2Image from 'src/coinbase-earn/lesson2.jpg'
import lesson3Image from 'src/coinbase-earn/lesson3.jpg'
import { H1, H4 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { Adventure } from 'src/home/Adventure'
import { NameSpaces, useTranslation } from 'src/i18n'
import nonProfitIMG from 'src/icons/non-profit-light-bg.png'
import sendToPhoneImg from 'src/icons/sent-to-phone_light-bg.png'
import valora from 'src/icons/valora-icon.png'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import pagePaths from 'src/shared/menu-items'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

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
          <Image source={learnLogo} style={styles.logo} resizeMode="contain" />
          <H4>{t('sequenceTitle')}</H4>
        </Cell>
      </GridRow>
      <GridRow>
        <ContentPreview
          title={t('lesson1')}
          time={t('minutes', { count: 3 })}
          href={'https://coinbase.com/earn/celo/lesson/1'}
          src={lesson1Image}
        />
        <ContentPreview
          title={t('lesson2')}
          time={t('minutes', { count: 2 })}
          href={'https://coinbase.com/earn/celo/lesson/2'}
          src={lesson2Image}
        />
        <ContentPreview
          title={t('lesson3')}
          time={t('minutes', { count: 3 })}
          href={'https://coinbase.com/earn/celo/lesson/3'}
          src={lesson3Image}
        />
      </GridRow>
    </View>
  )
}

interface ContentPreviewProps {
  title: string
  time: string
  href: string
  src: ImageSourcePropType
}

function ContentPreview({ title, time, href, src }: ContentPreviewProps) {
  return (
    <Cell span={Spans.third}>
      <a href={href} target={'_blank'}>
        <AspectRatio ratio={612 / 343} style={styles.preview}>
          <Image style={standardStyles.image} source={src} />
        </AspectRatio>
      </a>
      <Text target={'_blank'} accessibilityRole="link" href={href} style={fonts.h6}>
        {title}
      </Text>
      <Text style={[fonts.h6, styles.minutes]}>{time}</Text>
    </Cell>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  preview: { marginBottom: 15 },
  logo: { width: 239, height: 77 },
  valora: { height: 70, width: 70 },
  valoraDesktop: { marginTop: 30, height: 70, width: 70 },
  minutes: { color: colors.grayHeavy, marginTop: 2 },
})
