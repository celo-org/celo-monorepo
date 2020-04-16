import * as React from 'react'
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
const TECH_MENU = [menu.PAPERS, { name: 'Docs', link: CeloLinks.docs }]

const eventsLink = `${menu.COMMUNITY.link}#${hashNav.connect.events}`
const ecoFundLink = `${menu.COMMUNITY.link}#${hashNav.connect.fund}`

const RESOURCE_MENU = [
  menu.CODE_OF_CONDUCT,
  { name: 'Events', link: eventsLink },
  menu.BRAND,
  { name: 'EcoSystem Fund', link: ecoFundLink },
]

const ICON_SIZE = 13

export default function Footer() {
  const { t } = useTranslation(NameSpaces.common)
  const { isMobile, isTablet } = useScreenSize()
  const socialMenu = [
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
      link: CeloLinks.discord,
      icon: <YouTube size={ICON_SIZE} color={colors.dark} />,
    },
    { name: 'Instagram', link: CeloLinks.discord, icon: <Instagram size={ICON_SIZE} /> },
  ]
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
      <GridRow tabletStyle={{ flexDirection: 'column', alignItems: 'center' }}>
        <Cell span={Spans.third} tabletSpan={Spans.twoThird}>
          <View
            style={isMobile || isTablet ? [standardStyles.centered, styles.rings] : styles.rings}
          >
            <RingsGlyph />
          </View>
          <Details />
        </Cell>
        <Cell span={Spans.twoThird} tabletSpan={Spans.full}>
          <View style={styles.linksArea}>
            <FooterColumn heading={'Celo'} links={MENU} />
            <FooterColumn heading={t('footer.technology')} links={TECH_MENU} />
            <FooterColumn heading={t('footer.resources')} links={RESOURCE_MENU} />
            <FooterColumn heading={t('footer.social')} links={socialMenu} />
          </View>
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.blockMargin}
        tabletStyle={standardStyles.blockMarginTablet}
        mobileStyle={standardStyles.blockMarginMobile}
      >
        <Cell span={Spans.full} style={isMobile ? standardStyles.centered : styles.toes}>
          <ChangeStory />
          <Copyright />
        </Cell>
      </GridRow>
    </>
  )
}

const Details = React.memo(function _Details() {
  const { t } = useTranslation(NameSpaces.common)
  const { isDesktop } = useScreenSize()
  const fontStyling = [
    isDesktop ? textStyles.left : textStyles.center,
    styles.detailsText,
    fonts.legal,
  ]
  return (
    <View style={styles.details}>
      <Text style={fontStyling}>{t('disclaimer')}</Text>
      <Text style={fontStyling}>
        <Trans ns={NameSpaces.common} i18nKey={'footerReadMoreTerms'}>
          <InlineAnchor href={menu.TERMS.link}>Terms of Service</InlineAnchor>
        </Trans>
      </Text>
    </View>
  )
})

function Copyright() {
  const year = new Date().getFullYear()
  const { t } = useTranslation(NameSpaces.common)
  return <Text style={fonts.legal}>{t('copyRight', { year })}</Text>
}

const styles = StyleSheet.create({
  linksArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  details: {
    paddingBottom: 20,
  },
  detailsText: {
    marginBottom: 20,
  },
  rings: { marginBottom: 50 },
  form: {
    maxWidth: 550,
  },
  emailLogo: { width: 50, height: 50, marginVertical: 10 },
  toes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
