import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { GAP, brandStyles } from 'src/brandkit/common/constants'
import Page from 'src/brandkit/common/Page'
import SectionTitle from 'src/brandkit/common/SectionTitle'
import Judgement, { Value } from 'src/brandkit/logo/Judgement'
import LogoExample, { Logos } from 'src/brandkit/logo/LogoExample'
import LogoWithBackground from 'src/brandkit/logo/LogoWithBackground'
import { H1, H3 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import LogoLightBg from 'src/logos/LogoLightBg'
import RingsLight from 'src/logos/RingsLight'
import AspectRatio from 'src/shared/AspectRatio'
import Button, { BTN } from 'src/shared/Button.3'
import { hashNav } from 'src/shared/menu-items'
import { colors, fonts, standardStyles } from 'src/styles'
export default React.memo(function Logo() {
  return (
    <Page
      sections={[
        {
          id: hashNav.brandLogo.overview,
          children: <Overview />,
        },
        // {
        //   id: hashNav.brandLogo.glyph,
        //   children: (
        //     <View style={[styles.container, { minHeight: 400, backgroundColor: colors.primary }]}>
        //       <Text>glyph</Text>
        //     </View>
        //   ),
        // },
        {
          id: hashNav.brandLogo.clearspace,
          children: <Clearspace />,
        },
        // {
        //   id: hashNav.brandLogo.size,
        //   children: (
        //     <View style={[styles.container, { height: 500, backgroundColor: colors.deepBlue }]}>
        //       <Text>size</Text>
        //     </View>
        //   ),
        // },
        {
          id: hashNav.brandLogo.backgrounds,
          children: <Backgrounds />,
        },
      ]}
    />
  )
})

const Overview = withNamespaces(NameSpaces.brand)(function _Overview({ t }: I18nProps) {
  return (
    <View style={styles.container}>
      <View style={styles.gap}>
        <H1 style={standardStyles.elementalMarginBottom}>{t('logo.title')}</H1>
        <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
          {t('logo.overviewCopy')}
        </Text>
        <Button kind={BTN.PRIMARY} text={t('logo.overviewBtn')} />
        <View style={[standardStyles.centered, styles.fullScreenLogo]}>
          <LogoLightBg height={100} />
        </View>
        <H3 style={[standardStyles.elementalMargin, standardStyles.blockMarginTop]}>
          {t('logo.logoTitle')}
        </H3>
        <Text style={fonts.p}>{t('logo.logoText')}</Text>
      </View>
      <View style={styles.tiling}>
        <LogoExample
          logoType={Logos.light}
          background={colors.faintGray}
          btnText={t('downloadAssetBtn')}
          caption={t('logo.fullColorOnLightCaption')}
        />
        <LogoExample
          logoType={Logos.dark}
          background={colors.dark}
          btnText={t('downloadAssetBtn')}
          caption={t('logo.fullColorOnDarkCaption')}
        />
        <LogoExample
          logoType={Logos.black}
          background={colors.faintGray}
          btnText={t('downloadAssetBtn')}
          caption={t('logo.monochromeCaption')}
        />
        <LogoExample
          logoType={Logos.white}
          background={colors.dark}
          btnText={t('downloadAssetBtn')}
          caption={t('logo.monochromeInverseCaption')}
        />
      </View>
      <View style={styles.gap}>
        <H3 style={[standardStyles.elementalMargin, standardStyles.blockMarginTop]}>
          {t('logo.glyphTitle')}
        </H3>
        <Text style={fonts.p}>{t('logo.glyphText')}</Text>
        <Button kind={BTN.TERTIARY} text={t('downloadAssetBtn')} style={brandStyles.button} />
        <View style={styles.tiling}>
          <View
            style={[standardStyles.centered, styles.pilar, { backgroundColor: colors.faintGray }]}
          >
            <RingsLight height={35} />
          </View>
          <View style={[standardStyles.centered, styles.pilar, { backgroundColor: colors.dark }]}>
            <RingsLight height={35} />
          </View>
          <View
            style={[standardStyles.centered, styles.pilar, { backgroundColor: colors.faintPurple }]}
          >
            <RingsLight height={35} color={colors.black} />
          </View>
          <View
            style={[standardStyles.centered, styles.pilar, { backgroundColor: colors.primary }]}
          >
            <RingsLight height={35} color={colors.white} />
          </View>
        </View>
      </View>
      <View>
        <H3 style={[styles.gap, standardStyles.elementalMargin, standardStyles.blockMarginTop]}>
          {t('logo.sizeTitle')}
        </H3>
        <Text style={[fonts.p, styles.gap]}>{t('logo.sizeText')}</Text>
        <View style={[standardStyles.centered, styles.sizingArea]}>
          <AspectRatio ratio={392 / 160} style={styles.sizing}>
            <Image
              source={require('src/brandkit/images/sizing.png')}
              style={standardStyles.image}
              resizeMode="contain"
            />
          </AspectRatio>
        </View>
      </View>
    </View>
  )
})

const Clearspace = withNamespaces(NameSpaces.brand)(function _ClearSpace({ t }) {
  return (
    <View style={styles.gap}>
      <SectionTitle>{t('logo.clearspaceTitle')}</SectionTitle>
      <Text style={fonts.p}>{t('logo.clearspaceText')}</Text>
      <View
        style={[
          standardStyles.centered,
          standardStyles.elementalMarginTop,
          styles.clearspaceImageArea,
        ]}
      >
        <AspectRatio ratio={714 / 357} style={styles.clearspaceImage}>
          <Image
            resizeMethod="resize"
            resizeMode="contain"
            source={require('src/brandkit/images/ClearspaceImage.png')}
            style={standardStyles.image}
          />
        </AspectRatio>
      </View>
    </View>
  )
})

const Backgrounds = withNamespaces(NameSpaces.brand)(function _Backgrounds({ t }: I18nProps) {
  return (
    <View>
      <View style={styles.gap}>
        <SectionTitle>{t('logo.backgroundsTitle')}</SectionTitle>
        <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
          {t('logo.backgroundTextTop')}
        </Text>
      </View>
      <View style={[styles.tiling, standardStyles.elementalMarginBottom]}>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={colors.white} hasBorder={true} type="light" />
        </View>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={'#F8F9F9'} hasBorder={true} type="light" />
        </View>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={'#FEF2D6'} type="light" />
        </View>
      </View>
      <H3 style={[styles.gap, standardStyles.elementalMargin, standardStyles.blockMarginTop]}>
        {t('logo.colorBackgroundsTitle')}
      </H3>
      <Text style={[fonts.p, styles.gap]}>{t('logo.colorBackgroundsText')}</Text>
      <View style={styles.tiling}>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={colors.faintPurple} type="black" />
        </View>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={'#FEDEDA'} type="black" />
        </View>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={'#DCF6FF'} type="black" />
        </View>
      </View>
      <View style={styles.tiling}>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={'#8857F6'} type="white" />
        </View>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={'#F0544A'} type="white" />
        </View>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={'#3DBFFF'} type="white" />
        </View>
      </View>
      <Text style={[styles.gap, fonts.p, standardStyles.elementalMarginTop]}>
        {t('logo.backgroundDoNotAndDo')}
      </Text>
      <View style={styles.tiling}>
        <Judgement is={Value.Bad}>
          <LogoWithBackground image={require('src/brandkit/images/lilah.jpg')} type="dark" />
        </Judgement>
        <Judgement is={Value.Bad}>
          <LogoWithBackground backgroundColor={colors.faintPurple} type="light" />
        </Judgement>
        <Judgement is={Value.Bad}>
          <LogoWithBackground backgroundColor={'#3DBFFF'} type="dark" />
        </Judgement>
      </View>
      <View style={styles.tiling}>
        <Judgement is={Value.Good}>
          <LogoWithBackground
            backgroundColor={colors.dark}
            image={require('src/brandkit/images/lilahOverlay.jpg')}
            type="white"
          />
        </Judgement>
        <Judgement is={Value.Good}>
          <LogoWithBackground backgroundColor={colors.faintPurple} type="black" />
        </Judgement>
        <Judgement is={Value.Good}>
          <LogoWithBackground backgroundColor={'#3DBFFF'} type="white" />
        </Judgement>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 200,
    paddingVertical: GAP,
  },

  pilar: { minWidth: 175, flex: 1, height: 350 },
  gap: { marginHorizontal: GAP },
  tiling: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  clearspaceImage: {
    maxWidth: 600,
    width: '100%',
    marginVertical: 10,
  },
  clearspaceImageArea: {
    backgroundColor: colors.faintGray,
    padding: 20,
  },
  sizing: {
    maxWidth: 500,
    width: '100%',
  },
  sizingArea: {
    paddingVertical: 60,
  },
  fullScreenLogo: { width: '100%', marginVertical: 100 },
})
