import Link from 'next/link'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import Discord from 'src/icons/Discord'
import Discourse from 'src/icons/Discourse'
import MediumLogo from 'src/icons/MediumLogo'
import Octocat from 'src/icons/Octocat'
import TwiterLogo from 'src/icons/TwitterLogo'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import RingsGlyph from 'src/logos/RingsGlyph'
import Button, { BTN } from 'src/shared/Button.3'
import InlineAnchor from 'src/shared/InlineAnchor'
import menu, { CeloLinks } from 'src/shared/menu-items'
import Responsive from 'src/shared/Responsive'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
const menuItems = [menu.HOME, menu.ABOUT_US, menu.JOBS, menu.BUILD, menu.COMMUNITY]

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
        tabletStyle={standardStyles.blockMarginTablet}
        desktopStyle={standardStyles.blockMargin}
      >
        <Cell span={Spans.half} tabletSpan={Spans.fourth}>
          <Social />
        </Cell>
        <Cell span={Spans.half} tabletSpan={Spans.three4th}>
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
    <Responsive medium={styles.social}>
      <View style={[styles.social, styles.socialMobile]}>
        <MediumLogo color={colors.dark} height={height} />
        <Link href={CeloLinks.gitHub}>
          <a>
            <Octocat color={colors.dark} size={height} />
          </a>
        </Link>
        <TwiterLogo color={colors.dark} height={height} />
        <Link href={CeloLinks.discourse}>
          <a>
            <Discourse color={colors.dark} size={height} />
          </a>
        </Link>
        <Link href={CeloLinks.discord}>
          <a>
            <Discord color={colors.dark} size={height} />
          </a>
        </Link>
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
    <Responsive large={styles.menu}>
      <View style={isVertical ? styles.verticalMenu : styles.menuMobile}>
        {menuItems.map((item, index) => {
          const linkIsToCurrentPage = isVertical && currentPage === item.link
          const btnKind = linkIsToCurrentPage ? BTN.TERTIARY : BTN.NAV
          return (
            <View
              key={index}
              style={[
                styles.menuItem,
                !isVertical && index === 0 && { marginLeft: 0 },
                isVertical && linkIsToCurrentPage
                  ? styles.currentMenuItem
                  : styles.verticalMenuItem,
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
      <Responsive medium={[textStyles.left, styles.detailsText, fonts.legal]}>
        <Text style={[textStyles.center, styles.detailsText, fonts.legal]}>
          {t('trueGold.0')}
          <Text style={styles.bar}>|</Text>
          {t('trueGold.1')}
        </Text>
      </Responsive>
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
    maxWidth: 210,
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  socialMobile: { alignSelf: 'center' },
  details: {
    paddingTop: 40,
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
  },
  menuMobile: {
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  verticalMenu: {
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  verticalMenuItem: {
    marginVertical: 30,
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
