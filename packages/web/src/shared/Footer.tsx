import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import Discord from 'src/icons/Discord'
import Discourse from 'src/icons/Discourse'
import Instagram from 'src/icons/Instagram'
import MediumLogo from 'src/icons/MediumLogo'
import Octocat from 'src/icons/Octocat'
import TwiterLogo from 'src/icons/TwitterLogo'
import YouTube from 'src/icons/YouTube'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import RingsGlyph from 'src/logos/RingsGlyph'
import Button, { BTN } from 'src/shared/Button.3'
import ChangeStory from 'src/shared/ChangeStory'
import InlineAnchor from 'src/shared/InlineAnchor'
import menu, { CeloLinks, MAIN_MENU } from 'src/shared/menu-items'
import Responsive from 'src/shared/Responsive'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
const FOOTER_MENU = [menu.HOME, ...MAIN_MENU]

interface Props {
  isVertical?: boolean
  currentPage?: string
}

export class Footer extends React.PureComponent<Props & I18nProps> {
  render() {
    const { t, isVertical, currentPage } = this.props

    if (isVertical) {
      return (
        <View style={styles.verticalContainer}>
          <Navigation t={t} isVertical={true} currentPage={currentPage} />
          <View style={[standardStyles.centered, styles.rings]}>
            <RingsGlyph height={30} />
          </View>
        </View>
      )
    }

    return (
      <GridRow
        mobileStyle={styles.mobileContainer}
        tabletStyle={[standardStyles.blockMarginTablet, styles.mobileContainer]}
        desktopStyle={standardStyles.blockMargin}
      >
        <Cell span={Spans.half} tabletSpan={Spans.full}>
          <Social />
        </Cell>
        <Cell span={Spans.half} tabletSpan={Spans.full}>
          <Navigation t={t} isVertical={false} />
          <Details t={t} />
        </Cell>
      </GridRow>
    )
  }
}

const Social = React.memo(function _Social() {
  const height = 30
  return (
    <Responsive large={[styles.social, styles.socialDesktop]} medium={styles.social}>
      <View style={[styles.social, styles.socialMobile]}>
        <View style={styles.socialIcon}>
          <MediumLogo color={colors.dark} height={height} />
        </View>
        <View style={styles.socialIcon}>
          <a target="_blank" rel="noopener" href={CeloLinks.gitHub}>
            <Octocat color={colors.dark} size={height} />
          </a>
        </View>
        <View style={styles.socialIcon}>
          <TwiterLogo color={colors.dark} height={height} />
        </View>
        <View style={styles.socialIcon}>
          <a target="_blank" rel="noopener" href={CeloLinks.discourse}>
            <Discourse color={colors.dark} size={height} />
          </a>
        </View>
        <View style={styles.socialIcon}>
          <a target="_blank" rel="noopener" href={CeloLinks.discord}>
            <Discord color={colors.dark} size={height} />
          </a>
        </View>
        <View style={styles.socialIcon}>
          <a target="_blank" rel="noopener" href={CeloLinks.youtube}>
            <YouTube color={colors.dark} size={height} />
          </a>
        </View>
        <View style={styles.socialIcon}>
          <a target="_blank" rel="noopener" href={CeloLinks.instagram}>
            <Instagram size={height} />
          </a>
        </View>
      </View>
    </Responsive>
  )
})

interface NavProps {
  t: I18nProps['t']
  isVertical: boolean
  currentPage?: string
}

const Navigation = React.memo(function _Navigation({
  isVertical,
  t,
  currentPage = null,
}: NavProps) {
  return (
    <Responsive large={styles.menu} medium={isVertical ? styles.verticalMenu : styles.menuTablet}>
      <View style={isVertical ? styles.verticalMenu : styles.menuMobile}>
        {FOOTER_MENU.map((item, index) => {
          const linkIsToCurrentPage = isVertical && currentPage === item.link
          const btnKind = linkIsToCurrentPage ? BTN.TERTIARY : BTN.NAV
          const verticalItemStyle = linkIsToCurrentPage
            ? styles.currentMenuItem
            : styles.verticalMenuItem

          return (
            <View
              key={index}
              style={[
                styles.menuItem,
                !isVertical && index === 0 && { marginLeft: 0 },
                isVertical && verticalItemStyle,
              ]}
            >
              {/*
              // @ts-ignore */}
              <Button
                href={item.link}
                text={t(item.name)}
                kind={btnKind}
                key={item.name}
                align={'center'}
                style={isVertical && styles.mobileButtonSize}
              />
            </View>
          )
        })}
      </View>
    </Responsive>
  )
})

const YEAR = new Date().getFullYear()

const Details = React.memo(function _Details({ t }: { t: I18nProps['t'] }) {
  return (
    <View style={styles.details}>
      <ChangeStory />
      <Responsive medium={[textStyles.left, styles.detailsText, fonts.legal]}>
        <Text style={[textStyles.center, styles.detailsText, fonts.legal]}>{t('disclaimer')}</Text>
      </Responsive>
      <Responsive medium={[textStyles.left, styles.detailsText, fonts.legal]}>
        <Text style={[textStyles.center, styles.detailsText, fonts.legal]}>
          <Trans ns={NameSpaces.common} i18nKey={'footerReadMoreTerms'}>
            <InlineAnchor href={menu.TERMS.link}>Terms of Service</InlineAnchor>
          </Trans>
        </Text>
      </Responsive>
      <Responsive medium={[textStyles.left, fonts.legal]}>
        <Text style={[textStyles.center, fonts.legal]}>{t('copyRight', { year: YEAR })}</Text>
      </Responsive>
    </View>
  )
})

const styles = StyleSheet.create({
  social: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    width: '100%',
    marginTop: 30,
  },
  socialMobile: { alignSelf: 'center', justifyContent: 'center' },
  socialDesktop: { marginTop: 10 },
  socialIcon: {
    paddingRight: 25,
  },
  details: {
    paddingBottom: 20,
  },
  detailsText: {
    marginBottom: 20,
  },
  mobileContainer: {
    flexDirection: 'column-reverse',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  rings: { paddingVertical: 30 },
  menu: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  menuTablet: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginBottom: 20,
  },
  menuMobile: {
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  verticalMenu: {
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  verticalMenuItem: {
    marginVertical: 20,
  },
  currentMenuItem: {
    marginVertical: 30,
  },
  bar: {
    color: colors.gold,
    paddingLeft: 15,
    paddingRight: 12,
  },
  menuItem: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
  mobileButtonSize: {
    fontSize: 20,
    alignItems: 'center',
  },
})

export default withNamespaces(NameSpaces.common)(Footer)
