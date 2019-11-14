import { I18nProps } from 'next-i18next'
import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H2, H3, H4 } from 'src/fonts/Fonts'
import { NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { fonts, standardStyles } from 'src/styles'

const Engage = React.memo(function _Engage({ t, screen }: I18nProps & ScreenProps) {
  return (
    <>
      <GridRow
        desktopStyle={standardStyles.sectionMarginTop}
        tabletStyle={standardStyles.sectionMarginTopTablet}
        mobileStyle={standardStyles.sectionMarginTopMobile}
        allStyle={styles.alignOut}
      >
        <Cell span={Spans.half}>
          <H3 style={standardStyles.elementalMarginBottom}>{t('engage.topTitle')}</H3>
          <H2 style={standardStyles.blockMarginBottom}>{t('engage.mainTitle')}</H2>
          <Content
            screen={screen}
            noun={t('engage.validators.noun')}
            verb={t('engage.validators.verb')}
            network={t('engage.validators.network')}
            caption={t('engage.validators.caption')}
            primaryAction={{ text: t('engage.validators.primaryAction'), href: '/TODO' }}
            secondaryAction={{ text: t('engage.validators.secondaryAction'), href: '/TODO' }}
          />
        </Cell>
        <Cell span={Spans.half} style={[styles.asides]}>
          <Aside
            screen={screen}
            text={t('engage.tutorial.copy')}
            title={t('engage.tutorial.title')}
            href="?todo"
            btnText={t('engage.tutorial.btnText')}
            image={require('src/icons/download-dark.png')}
          />
          <Aside
            screen={screen}
            text={t('engage.blog.copy')}
            title={t('engage.blog.title')}
            href="?todo"
            btnText={t('engage.blog.btnText')}
            image={require('src/icons/blog-dark.png')}
          />
        </Cell>
      </GridRow>
      <GridRow
        allStyle={styles.alignOut}
        desktopStyle={standardStyles.blockMarginTop}
        tabletStyle={standardStyles.blockMarginTopTablet}
        mobileStyle={standardStyles.blockMarginTopMobile}
      >
        <Cell span={Spans.half}>
          <Content
            screen={screen}
            noun={t('engage.developers.noun')}
            verb={t('engage.developers.verb')}
            network={t('engage.developers.network')}
            caption={t('engage.developers.caption')}
            primaryAction={{ text: t('engage.developers.primaryAction'), href: '/TODO' }}
            secondaryAction={{ text: t('engage.developers.secondaryAction'), href: '/TODO' }}
          />
        </Cell>
        <Cell span={Spans.half} style={[styles.asides]}>
          <Aside
            screen={screen}
            text={t('engage.faucet.copy')}
            title={t('engage.faucet.title')}
            href="?todo"
            btnText={t('engage.faucet.btnText')}
            image={require('src/icons/faucet-dark.png')}
          />
          <Aside
            screen={screen}
            text={t('engage.docs.copy')}
            title={t('engage.docs.title')}
            href="?todo"
            btnText={t('engage.docs.btnText')}
            image={require('src/icons/documentation-dark.png')}
          />
        </Cell>
      </GridRow>
      <GridRow
        allStyle={[standardStyles.elementalMarginBottom, styles.alignOut]}
        desktopStyle={standardStyles.blockMarginTop}
        tabletStyle={standardStyles.blockMarginTopTablet}
        mobileStyle={standardStyles.blockMarginTopMobile}
      >
        <Cell span={Spans.half}>
          <H3>{t('engage.contributeTitle')}</H3>
        </Cell>
      </GridRow>
      <GridRow
        allStyle={[styles.alignOut]}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Cell span={Spans.half}>
          <View
            style={[
              styles.paragraphArea,
              styles.matchNeighbourHeight,
              screen === ScreenSizes.MOBILE && standardStyles.blockMarginMobile,
            ]}
          >
            <Fade fraction={0.5} bottom={true} distance={'10px'}>
              <AspectRatio ratio={248 / 286} style={styles.cakeContainer}>
                <Image
                  source={require('src/dev/cakeProtector.png')}
                  style={styles.graphic}
                  resizeMode="contain"
                />
              </AspectRatio>
            </Fade>
            <H4 style={standardStyles.elementalMarginTop}>{t('engage.secure.title')}</H4>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
              {t('engage.secure.copy')}
            </Text>
            <Button kind={BTN.PRIMARY} text={t('engage.secure.btnText')} />
          </View>
        </Cell>
        <Cell span={Spans.half}>
          <View
            style={[
              styles.paragraphArea,
              styles.matchNeighbourHeight,
              screen === ScreenSizes.MOBILE && standardStyles.blockMarginMobile,
            ]}
          >
            <Fade fraction={0.5} bottom={true} distance={'10px'}>
              <AspectRatio ratio={248 / 286} style={styles.cakeContainer}>
                <Image
                  source={require('src/dev/cakeProtector.png')}
                  style={styles.graphic}
                  resizeMode="contain"
                />
              </AspectRatio>
              ) }}
            </Fade>

            <H4 style={standardStyles.elementalMarginTop}>{t('engage.improve.title')}</H4>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
              {t('engage.improve.copy')}
            </Text>
            <Button kind={BTN.PRIMARY} text={t('engage.improve.btnText')} />
          </View>
        </Cell>
      </GridRow>
    </>
  )
})

export default withNamespaces(NameSpaces.dev)(withScreenSize(Engage))

interface ContentProps {
  noun: string
  verb: string
  network: string
  caption: string
  primaryAction: { text: string; href: string }
  secondaryAction: { text: string; href: string }
  screen: ScreenSizes
}

const Content = React.memo(function _Content(props: ContentProps) {
  return (
    <View style={styles.paragraphArea}>
      <H3 style={standardStyles.elementalMarginBottom}>{props.noun}</H3>
      <H4 style={standardStyles.elementalMarginBottom}>{props.verb}</H4>
      <Text style={fonts.h5}>{props.network}</Text>
      <Fade fraction={0.5} bottom={true} distance={'10px'}>
        <AspectRatio style={styles.graphicContainer} ratio={290 / 225}>
          <Image
            style={styles.graphic}
            source={require('src/dev/cakeLayering.jpg')}
            resizeMode="contain"
          />
        </AspectRatio>
      </Fade>
      <Text style={[fonts.p]}>{props.caption}</Text>
      <View style={[standardStyles.row, standardStyles.elementalMarginTop, styles.buttons]}>
        <View style={styles.primaryButtonContainer}>
          <Button
            size={props.screen === ScreenSizes.MOBILE ? SIZE.small : SIZE.normal}
            kind={BTN.PRIMARY}
            text={props.primaryAction.text}
            href={props.primaryAction.href}
          />
        </View>
        <View style={styles.nakedButtonContainer}>
          <Button
            size={SIZE.normal}
            kind={BTN.NAKED}
            text={props.secondaryAction.text}
            href={props.secondaryAction.href}
            align={'center'}
          />
        </View>
      </View>
    </View>
  )
})

interface AsideProps {
  title: string
  text: string
  href: string
  btnText: string
  image: ImageSourcePropType
  screen: ScreenSizes
}

const Aside = React.memo(function _Aside({
  image,
  title,
  text,
  href,
  btnText,
  screen,
}: AsideProps) {
  const isMobile = screen === ScreenSizes.MOBILE
  return (
    <View
      style={[
        !isMobile && standardStyles.row,
        standardStyles.elementalMargin,
        styles.paragraphArea,
      ]}
    >
      <View style={styles.asideFrame}>
        <Fade fraction={0.5} bottom={true} distance={'10px'}>
          <AspectRatio style={styles.asideGraphic} ratio={1}>
            <Image source={image} style={styles.graphic} />
          </AspectRatio>
        </Fade>
      </View>
      <View style={[styles.asideContent, isMobile && styles.asideContentMobile]}>
        <Text style={fonts.h5}>{title}</Text>
        <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>{text}</Text>
        <Button kind={BTN.NAKED} text={btnText} href={href} size={SIZE.small} />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  asides: {
    justifyContent: 'center',
  },
  nakedButtonContainer: {
    height: 'min-content',
  },
  primaryButtonContainer: {
    marginEnd: 20,
  },
  buttons: {
    alignItems: 'center',
  },
  graphicContainer: {
    maxWidth: 290,
    paddingBottom: 10,
  },
  graphic: {
    width: '100%',
    height: '100%',
  },
  asideGraphic: { width: 60 },
  asideFrame: { flexBasis: 80 },
  asideContentMobile: { marginHorizontal: 0 },
  asideContent: {
    flex: 1,
    flexWrap: 'wrap',
    marginHorizontal: 10,
  },
  alignOut: {
    justifyContent: 'space-between',
  },
  cakeContainer: { height: 248, maxWidth: 286 },
  paragraphArea: {
    maxWidth: 430,
  },
  matchNeighbourHeight: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
})
