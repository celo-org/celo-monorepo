import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Palette from 'src/brandkit/color/Palette'
import { brandStyles, GAP } from 'src/brandkit/common/constants'
import { BACKGROUND_PALETTE } from 'src/brandkit/common/data'
import Page from 'src/brandkit/common/Page'
import SectionTitle from 'src/brandkit/common/SectionTitle'
import Judgement, { Value } from 'src/brandkit/logo/Judgement'
import LogoExample, { Logos } from 'src/brandkit/logo/LogoExample'
import LogoWithBackground from 'src/brandkit/logo/LogoWithBackground'
import { H1, H3 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import LogoLightBg from 'src/logos/LogoLightBg'
import RingsGlyph from 'src/logos/RingsGlyph'
import AspectRatio from 'src/shared/AspectRatio'
import Button, { BTN } from 'src/shared/Button.3'
import { hashNav } from 'src/shared/menu-items'
import { colors, fonts, standardStyles } from 'src/styles'
import DownloadButton from 'src/brandkit/common/DownloadButton'

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
          id: hashNav.brandLogo.space,
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

const Overview = withNamespaces(NameSpaces.brand)(
  withScreenSize<I18nProps>(function _Overview({ t, screen }: I18nProps & ScreenProps) {
    const glyphAreaStyle = screen === ScreenSizes.DESKTOP ? styles.pilar : styles.square
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
          <Text style={[fonts.h5a, standardStyles.elementalMargin, standardStyles.blockMarginTop]}>
            {t('logo.logoTitle')}
          </Text>
          <Text style={fonts.p}>{t('logo.logoText')}</Text>
        </View>
        <View style={styles.tiling}>
          <LogoExample
            hasBorder={true}
            logoType={Logos.light}
            background={colors.white}
            href="/todo"
            caption={t('logo.fullColorOnLightCaption')}
          />
          <LogoExample
            hasBorder={false}
            logoType={Logos.dark}
            background={colors.dark}
            href="/todo"
            caption={t('logo.fullColorOnDarkCaption')}
          />
          <LogoExample
            hasBorder={true}
            logoType={Logos.black}
            background={colors.white}
            href="/todo"
            caption={t('logo.monochromeCaption')}
          />
          <LogoExample
            hasBorder={false}
            logoType={Logos.white}
            background={colors.dark}
            href="/todo"
            caption={t('logo.monochromeInverseCaption')}
          />
        </View>
        <View style={styles.gap}>
          <Text style={[fonts.h5a, standardStyles.elementalMargin, standardStyles.blockMarginTop]}>
            {t('logo.glyphTitle')}
          </Text>
          <Text style={fonts.p}>{t('logo.glyphText')}</Text>
          <DownloadButton href="/todo" />
          <View style={[styles.tiling, standardStyles.elementalMarginTop]}>
            <View
              style={[
                standardStyles.centered,
                glyphAreaStyle,
                { backgroundColor: colors.faintGray },
              ]}
            >
              <RingsGlyph height={35} />
            </View>
            <View
              style={[standardStyles.centered, glyphAreaStyle, { backgroundColor: colors.dark }]}
            >
              <RingsGlyph height={35} darkMode={true} />
            </View>
            <View
              style={[
                standardStyles.centered,
                glyphAreaStyle,
                { backgroundColor: colors.faintPurple },
              ]}
            >
              <RingsGlyph height={35} color={colors.black} />
            </View>
            <View
              style={[standardStyles.centered, glyphAreaStyle, { backgroundColor: colors.primary }]}
            >
              <RingsGlyph height={35} color={colors.white} />
            </View>
          </View>
        </View>
      </View>
    )
  })
)

const Clearspace = withNamespaces(NameSpaces.brand)(function _ClearSpace({ t }) {
  return (
    <>
      <View style={styles.gap}>
        <SectionTitle>{t('logo.SpaceSizeTitle')}</SectionTitle>
      </View>
      <Text
        style={[
          fonts.h5a,
          styles.gap,
          standardStyles.elementalMargin,
          standardStyles.blockMarginTop,
        ]}
      >
        {t('logo.clearspaceTitle')}
      </Text>
      <View style={styles.gap}>
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
      <View>
        <Text
          style={[
            fonts.h5a,
            styles.gap,
            standardStyles.elementalMargin,
            standardStyles.blockMarginTop,
          ]}
        >
          {t('logo.sizeTitle')}
        </Text>
        <Text style={[fonts.p, styles.gap]}>{t('logo.sizeText')}</Text>
        <View style={[styles.tiling, standardStyles.blockMarginTopMobile]}>
          <AspectRatio ratio={345 / 172} style={[styles.sizing, brandStyles.gap]}>
            <Image
              source={require('src/brandkit/images/digital-min.png')}
              style={standardStyles.image}
              resizeMode="contain"
            />
          </AspectRatio>
          <AspectRatio ratio={345 / 172} style={[styles.sizing, brandStyles.gap]}>
            <Image
              source={require('src/brandkit/images/print-min.png')}
              style={standardStyles.image}
              resizeMode="contain"
            />
          </AspectRatio>
        </View>
      </View>
    </>
  )
})

const Backgrounds = withNamespaces(NameSpaces.brand)(function _Backgrounds({ t }: I18nProps) {
  return (
    <View>
      <View style={styles.gap}>
        <SectionTitle>{t('logo.backgroundsTitle')}</SectionTitle>
      </View>
      <Palette colors={BACKGROUND_PALETTE} text={t('logo.backgroundTextTop')} />
      <View style={[styles.tiling, standardStyles.elementalMarginBottom]}>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={colors.faintGray} type="light" />
        </View>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={colors.faintGold} type="light" />
        </View>
        <View style={[styles.gap, styles.container]}>
          <LogoWithBackground backgroundColor={colors.dark} type="dark" />
        </View>
      </View>
      <Text
        style={[
          fonts.h5a,
          styles.gap,
          standardStyles.elementalMargin,
          standardStyles.blockMarginTop,
        ]}
      >
        {t('logo.colorBackgroundsTitle')}
      </Text>
      <Text style={[fonts.p, styles.gap]}>{t('logo.colorBackgroundsText')}</Text>

      <Text style={[styles.gap, fonts.p, standardStyles.elementalMargin]}>
        {t('logo.backgroundDoNotAndDo')}
      </Text>

      <TripplePairing
        first={
          <>
            <View style={[styles.gap, styles.container]}>
              <LogoWithBackground backgroundColor={colors.faintPurple} type="black" />
            </View>
            <View style={[styles.gap, styles.container]}>
              <LogoWithBackground backgroundColor={colors.purpleScreen} type="white" />
            </View>
          </>
        }
        second={
          <>
            <View style={[styles.gap, styles.container]}>
              <LogoWithBackground backgroundColor={colors.faintRed} type="black" />
            </View>

            <View style={[styles.gap, styles.container]}>
              <LogoWithBackground backgroundColor={colors.redScreen} type="white" />
            </View>
          </>
        }
        third={
          <>
            <View style={[styles.gap, styles.container]}>
              <LogoWithBackground backgroundColor={colors.faintCyan} type="black" />
            </View>
            <View style={[styles.gap, styles.container]}>
              <LogoWithBackground backgroundColor={colors.cyan} type="white" />
            </View>
          </>
        }
      />

      <TripplePairing
        first={
          <>
            <Judgement is={Value.Bad}>
              <LogoWithBackground image={require('src/brandkit/images/lilah.jpg')} type="dark" />
            </Judgement>
            <Judgement is={Value.Good}>
              <LogoWithBackground
                backgroundColor={colors.dark}
                image={require('src/brandkit/images/lilahOverlay.jpg')}
                type="white"
              />
            </Judgement>
          </>
        }
        second={
          <>
            <Judgement is={Value.Bad}>
              <LogoWithBackground backgroundColor={colors.faintPurple} type="light" />
            </Judgement>
            <Judgement is={Value.Good}>
              <LogoWithBackground backgroundColor={colors.faintPurple} type="black" />
            </Judgement>
          </>
        }
        third={
          <>
            <Judgement is={Value.Bad}>
              <LogoWithBackground backgroundColor={colors.cyan} type="dark" />
            </Judgement>
            <Judgement is={Value.Good}>
              <LogoWithBackground backgroundColor={colors.cyan} type="white" />
            </Judgement>
          </>
        }
      />
    </View>
  )
})

interface TripplePairingProps {
  first: React.ReactNode
  second: React.ReactNode
  third: React.ReactNode
}

const TripplePairing = withScreenSize<TripplePairingProps>(function _TripplePairing({
  first,
  second,
  third,
  screen,
}: TripplePairingProps & ScreenProps) {
  return (
    <View style={screen === ScreenSizes.DESKTOP ? styles.tiling : {}}>
      {[first, second, third].map((pair, index) => {
        return (
          <View
            style={screen === ScreenSizes.DESKTOP ? { flex: 1 } : standardStyles.row}
            key={index}
          >
            {pair}
          </View>
        )
      })}
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
  square: { minWidth: 175, flex: 1, height: 170 },
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
    backgroundColor: colors.white,
    padding: 30,
  },
  sizing: {
    flex: 1,
    minWidth: 280,
    marginVertical: GAP,
  },
  fullScreenLogo: { width: '100%', marginVertical: 100 },
})
