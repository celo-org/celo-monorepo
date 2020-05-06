import * as React from 'react'
import Lazy from 'react-lazyload'
import { Image, StyleSheet, Text, View } from 'react-native'
import EmailForm from 'src/forms/EmailForm'
import { NameSpaces, Trans, useTranslation } from 'src/i18n'
import Discord from 'src/icons/Discord'
import Discourse from 'src/icons/Discourse'
import Instagram from 'src/icons/Instagram'
import MediumLogo from 'src/icons/MediumLogo'
import Octocat from 'src/icons/Octocat'
import sendCoinIcon from 'src/icons/send-green-coin-lg-bg.png'
import { TweetLogo } from 'src/icons/TwitterLogo'
import YouTube from 'src/icons/YouTube'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import RingsGlyph from 'src/logos/RingsGlyph'
import ChangeStory from 'src/shared/ChangeStory'
import FooterColumn from 'src/shared/FooterColumn'
import InlineAnchor from 'src/shared/InlineAnchor'
import menu, { CeloLinks, hashNav, MAIN_MENU } from 'src/shared/menu-items'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

const MENU = [menu.HOME, ...MAIN_MENU]
const TECH_MENU = [
  { name: 'Docs', link: CeloLinks.docs },
  { name: 'Security Audits', link: CeloLinks.audits },
  menu.PAPERS,
]
const eventsLink = `${menu.COMMUNITY.link}#${hashNav.connect.events}`
const ecoFundLink = `${menu.COMMUNITY.link}#${hashNav.connect.fund}`
const RESOURCE_MENU = [
  menu.CODE_OF_CONDUCT,
  { name: 'Events', link: eventsLink },
  menu.BRAND,
  { name: 'Ecosystem Fund', link: ecoFundLink },
]

const ICON_SIZE = 13
const SOCIAL_MENU = [
  {
    name: 'Blog',
    link: CeloLinks.mediumPublication,
    icon: <MediumLogo height={ICON_SIZE} color={colors.dark} />,
  },
  {
    name: 'GitHub',
    link: CeloLinks.gitHub,
    icon: <Octocat size={ICON_SIZE} color={colors.dark} />,
  },
  {
    name: 'Twitter',
    link: CeloLinks.twitter,
    icon: <TweetLogo height={ICON_SIZE} color={colors.dark} />,
  },
  {
    name: 'Forum',
    link: CeloLinks.discourse,
    icon: <Discourse size={ICON_SIZE} color={colors.dark} />,
  },
  {
    name: 'Chat',
    link: CeloLinks.discord,
    icon: <Discord size={ICON_SIZE} color={colors.dark} />,
  },
  {
    name: 'YouTube',
    link: CeloLinks.youtube,
    icon: <YouTube size={ICON_SIZE} color={colors.dark} />,
  },
  { name: 'Instagram', link: CeloLinks.instagram, icon: <Instagram size={ICON_SIZE} /> },
]

export default function Footer() {
  const { t } = useTranslation(NameSpaces.common)
  const { isMobile, isTablet } = useScreenSize()
  const year = new Date().getFullYear()
  return (
    <>
      <GridRow
        allStyle={standardStyles.centered}
        desktopStyle={standardStyles.blockMargin}
        tabletStyle={standardStyles.blockMarginTablet}
        mobileStyle={standardStyles.blockMarginMobile}
      >
        <Cell
          span={Spans.half}
          tabletSpan={Spans.twoThird}
          style={[standardStyles.centered, styles.form]}
        >
          <Image resizeMode="contain" source={{ uri: sendCoinIcon }} style={styles.emailLogo} />
          <Text
            style={[
              fonts.p,
              textStyles.center,
              standardStyles.halfElement,
              standardStyles.elementalMarginTop,
            ]}
          >
            {t('receiveUpdates')}
          </Text>
          <EmailForm submitText={t('signUp')} route={'/contacts'} isDarkMode={false} />
        </Cell>
      </GridRow>
      <GridRow tabletStyle={styles.column}>
        <Cell span={Spans.third} tabletSpan={Spans.twoThird}>
          <View style={isMobile ? [standardStyles.centered, styles.ringsMobile] : styles.rings}>
            <RingsGlyph />
          </View>
          <Details />
        </Cell>
        <Cell span={Spans.twoThird} tabletSpan={Spans.full}>
          {isMobile ? (
            <MobileLinks />
          ) : (
            <View style={isTablet ? styles.linksAreaTablet : styles.linksArea}>
              <FooterColumn style={styles.linkColumnStart} heading={'Celo'} links={MENU} />
              <FooterColumn heading={t('footer.technology')} links={TECH_MENU} />
              <FooterColumn heading={t('footer.resources')} links={RESOURCE_MENU} />
              <FooterColumn
                style={styles.linkColumnEnd}
                heading={t('footer.social')}
                links={SOCIAL_MENU}
              />
            </View>
          )}
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.blockMargin}
        tabletStyle={standardStyles.blockMarginTablet}
        mobileStyle={standardStyles.blockMarginMobile}
      >
        <Cell span={Spans.full} style={isMobile ? standardStyles.centered : styles.toes}>
          <Lazy once={true}>
            {' '}
            <ChangeStory />
          </Lazy>
          <Text style={[fonts.legal, styles.copyright, isMobile && textStyles.center]}>
            {t('footer.copyright', { year })}
          </Text>
        </Cell>
      </GridRow>
    </>
  )
}

function MobileLinks() {
  const { t } = useTranslation(NameSpaces.common)
  return (
    <>
      <View style={standardStyles.row}>
        <FooterColumn heading={'Celo'} links={MENU} />
        <FooterColumn
          heading={t('footer.social')}
          links={SOCIAL_MENU}
          style={styles.endMobileColumn}
        />
      </View>
      <View style={standardStyles.row}>
        <FooterColumn heading={t('footer.resources')} links={RESOURCE_MENU} />
        <FooterColumn
          heading={t('footer.technology')}
          links={TECH_MENU}
          style={styles.endMobileColumn}
        />
      </View>
    </>
  )
}

const Details = React.memo(function _Details() {
  const { t } = useTranslation(NameSpaces.common)
  const { isMobile } = useScreenSize()
  const fontStyling = [
    fonts.legal,
    styles.detailsText,
    !isMobile ? textStyles.left : textStyles.center,
  ]
  return (
    <View style={[styles.details, isMobile && standardStyles.centered]}>
      <Text style={fontStyling}>{t('disclaimer')}</Text>
      <Text style={fontStyling}>
        <Trans ns={NameSpaces.common} i18nKey={'footerReadMoreTerms'}>
          <InlineAnchor href={menu.TERMS.link}>Terms of Service</InlineAnchor>
        </Trans>
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
  linksArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  linksAreaTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  details: {
    paddingBottom: 20,
  },
  detailsText: {
    marginBottom: 20,
    maxWidth: 350,
  },
  ringsMobile: { marginBottom: 30 },
  rings: { marginBottom: 20, transform: [{ translateY: -10 }] },
  form: {
    maxWidth: 550,
  },
  emailLogo: { width: 50, height: 50, marginVertical: 10 },
  toes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkColumnStart: {
    paddingStart: 0,
  },
  linkColumnEnd: {
    paddingEnd: 0,
  },
  endMobileColumn: {
    marginLeft: 20,
  },
  copyright: {
    zIndex: 10, // ensure copyright is above the sliding div from ChangeStory animation
  },
})
