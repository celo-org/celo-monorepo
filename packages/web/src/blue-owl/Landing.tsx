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

export default function Landing() {
  const [t] = useTranslation(NameSpaces.cbe)

  return (
    <View style={styles.root}>
      <OpenGraph title={t('pageTitle')} description={t('description')} path={pagePaths.CBE.link} />
      <Cover />
      <GridRow
        desktopStyle={standardStyles.blockMarginTop}
        tabletStyle={standardStyles.blockMarginTopTablet}
        mobileStyle={standardStyles.blockMarginTopMobile}
        allStyle={standardStyles.centered}
      >
        <Cell tabletSpan={Spans.full} span={Spans.full}>
          <H4 style={[textStyles.center, standardStyles.elementalMarginTop]}>{t('subTitle')}</H4>
          <H1 style={[textStyles.center, standardStyles.elementalMarginBottom]}>
            {t('mainTitle')}
          </H1>
        </Cell>
      </GridRow>
      <GridRow
        allStyle={standardStyles.blockMarginTopMobile}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
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
        />
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.blockMarginBottom}
        tabletStyle={standardStyles.blockMarginBottomTablet}
        mobileStyle={standardStyles.blockMarginBottomMobile}
      >
        <Cell span={Spans.full} style={standardStyles.centered}>
          <Image source={sequenceTopImage} style={styles.logo} resizeMode="contain" />
          <H4>{t('sequenceTitle')}</H4>
        </Cell>
      </GridRow>
      <GridRow>
        <ContentPreview title="Part 1" time={'2 min'} />
        <ContentPreview title="Part 2" time={'5 min'} />
        <ContentPreview title="Part 3" time={'3 min'} />
      </GridRow>
    </View>
  )
}

function ContentPreview({ title, time }) {
  return (
    <Cell span={Spans.third}>
      <Image style={styles.preview} source={sequenceTopImage} />
      <Text style={fonts.h5}>{title}</Text>
      <Text style={[fonts.h5, styles.minutes]}>{time}</Text>
    </Cell>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  preview: { backgroundColor: colors.gray, height: 222, marginBottom: 10 },
  logo: { width: 275, height: 75 },
  minutes: { color: colors.grayHeavy },
})
