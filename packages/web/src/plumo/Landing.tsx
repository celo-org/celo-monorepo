import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { H2 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import LogoDarkBg from 'src/logos/LogoDarkBg'
import FeatureTriangle from 'src/plumo/feather-triangle.svg'
import Outline from 'src/plumo/phone-outline.svg'
import OpenGraphic from 'src/plumo/plumo-open-graph.jpg'
import Button, { BTN } from 'src/shared/Button.3'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import FeatherPoint from './FeatherPoint'
import SkyMobile from 'src/plumo/plumo-sky-mobile.svg'
import Sky from 'src/plumo/plumo-sky.svg'

const PLUMO_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLScZswraVVC91RwToo_9qm-1QzGrxp7yjVeM2wzdTbL5T_lAgQ/viewform'

export default function PlumoLanding() {
  const { t } = useTranslation('plumo')
  const { isDesktop, isTablet, isMobile } = useScreenSize()
  return (
    <>
      <OpenGraph
        image={OpenGraphic}
        title={t('pageTitle')}
        description={t('pageDescription')}
        path="/plumo"
      />
      <View style={styles.root}>
        <View
          style={[
            // @ts-ignore
            isMobile ? gradientMobile : gradient,
            styles.coverContainer,
            isMobile && styles.coverContainerMobile,
          ]}
        >
          <Image
            source={isMobile ? SkyMobile : Sky}
            style={styles.coverBackgroundImage}
            resizeMode="cover"
          />
          <GridRow allStyle={standardStyles.centered}>
            <Cell span={Spans.full} style={[styles.cover, isMobile && styles.coverMobile]}>
              <Image
                source={FeatureTriangle}
                style={
                  isMobile
                    ? styles.coverImageMobile
                    : isTablet
                    ? styles.coverImageTablet
                    : styles.coverImage
                }
              />
              <View
                style={
                  isMobile
                    ? styles.coverContentMobile
                    : isTablet
                    ? styles.coverContentTablet
                    : styles.coverContent
                }
              >
                <Text style={[fonts.h2, textStyles.invert, isMobile && textStyles.center]}>
                  {t('coverTitle')}
                </Text>
                <Text
                  style={[
                    fonts.h4,
                    textStyles.invert,
                    styles.coverText,
                    isMobile && textStyles.center,
                  ]}
                >
                  {t('coverSubtitle')}
                </Text>
                <Button kind={BTN.PRIMARY} href={PLUMO_FORM} text={t('coverBtn')} />
              </View>
            </Cell>
          </GridRow>
        </View>
        <GridRow
          desktopStyle={standardStyles.sectionMargin}
          mobileStyle={standardStyles.sectionMarginBottomMobile}
        >
          <Cell span={Spans.full} style={isDesktop && standardStyles.centered}>
            {isDesktop && <Image source={Outline} style={styles.phoneOutline} />}
            <FeatherPoint title={t('figureHeading1')} text={t('figureSubheading1')} />
            <FeatherPoint
              title={t('figureHeading2')}
              text={t('figureSubheading2')}
              leftWard={true}
            />
            <FeatherPoint title={t('figureHeading3')} text={t('figureSubheading3')} />
          </Cell>
        </GridRow>
        <GridRow>
          <Cell span={Spans.full}>
            <H2 style={textStyles.invert}>{t('mainHeader')}</H2>
          </Cell>
        </GridRow>
        <GridRow>
          <Cell span={Spans.half}>
            <Text style={[fonts.p, textStyles.invert]}>{t('mainBody1')}</Text>
          </Cell>
          <Cell span={Spans.half}>
            <Text style={[fonts.p, textStyles.invert]}>{t('mainBody2')}</Text>
          </Cell>
        </GridRow>
        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={standardStyles.sectionMargin}
          mobileStyle={standardStyles.sectionMarginMobile}
        >
          <Cell span={Spans.half} style={standardStyles.centered}>
            <Image source={FeatureTriangle} style={styles.ctaImage} />
            <H2 style={[textStyles.invert, textStyles.center, styles.ctaHeader]}>
              {t('ctaHeader')}
            </H2>
            <Button kind={BTN.PRIMARY} href={PLUMO_FORM} text={t('ctaBtn')} />
          </Cell>
        </GridRow>
        <View style={styles.navbar}>
          <LogoDarkBg height={30} />
          <Button href={PLUMO_FORM} text={t('navSignup')} kind={BTN.DARKNAV} />
        </View>
      </View>
    </>
  )
}

const gradient = {
  background: `linear-gradient(104deg, #1AB062 -10%, #272A2E 15.16%, #272A2E 75.47%, #42D689 110.15%)`,
}

const gradientMobile = {
  background: `linear-gradient(104deg, #1AB062 -10%, #272A2E 38.16%)`,
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.dark,
    minHeight: '100vh',
  },
  navbar: {
    top: 0,
    left: 0,
    right: 0,
    position: 'fixed',
    width: '100%',
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 40,
    backgroundColor: 'rgba(46, 51, 56, 0.95)',
    backdropFilter: 'blur(5px)',
    zIndex: 100,
  },
  coverBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  coverContainer: {
    justifyContent: 'center',
    backgroundColor: 'black',
    width: '100vw',
    height: 590,
  },
  coverContainerMobile: {
    minHeight: 660,
  },
  cover: {
    marginRight: 15,
    justifyContent: 'center',
    flexDirection: 'row',
    alignitems: 'center',
  },
  coverMobile: {
    width: 'fit-content',
    flexDirection: 'column',
    alignContent: 'center',
    justifyContent: 'center',
    alignitems: 'center',
  },
  coverImage: { width: 300, height: 300 },
  coverImageMobile: { width: 200, height: 200, alignSelf: 'center', marginBottom: 30 },
  coverImageTablet: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginBottom: 30,
  },
  coverContent: {
    maxWidth: 340,
    justifyContent: 'center',
    marginLeft: 38,
  },
  coverContentTablet: {
    justifyContent: 'center',
    maxWidth: 320,
    paddingLeft: 30,
  },
  coverContentMobile: {
    alignItems: 'center',
    maxWidth: 340,
  },
  coverText: {
    marginTop: 8,
    marginBottom: 46,
  },
  phoneOutline: {
    height: 600,
    width: 300,
    position: 'absolute',
  },
  ctaImage: {
    width: 110,
    height: 110,
  },
  ctaHeader: {
    marginTop: 36,
    marginBottom: 48,
  },
})
