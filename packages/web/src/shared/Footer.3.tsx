import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import RingsLight from 'src/logos/RingsLight'
import Button, { BTN } from 'src/shared/Button.3'
import MediumLogo from 'src/shared/MediumLogo'
import menu from 'src/shared/menu-items'
import RedditLogo from 'src/shared/RedditLogo'
import Responsive from 'src/shared/Responsive'
import TwiterLogo from 'src/shared/TwitterLogo'
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
            <RingsLight height={30} />
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

function Social() {
  const height = 30
  return (
    <Responsive medium={styles.social}>
      <View style={[styles.social, styles.socialMobile]}>
        <MediumLogo color={colors.dark} height={height} />
        <TwiterLogo color={colors.dark} height={height} />
        <RedditLogo color={colors.dark} height={height} />
      </View>
    </Responsive>
  )
}

function Navigation({ isVertical, t, currentPage = null }) {
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
}

function Details({ t }) {
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
      <Responsive medium={[textStyles.left, fonts.legal]}>
        <Text style={[textStyles.center, fonts.legal]}>{t('copyRight')}</Text>
      </Responsive>
    </View>
  )
}

const styles = StyleSheet.create({
  social: {
    flexDirection: 'row',
    maxWidth: 160,
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

export default withNamespaces('common')(Footer)
