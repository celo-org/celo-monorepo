import throttle from 'lodash.throttle'
import dynamic from 'next/dynamic'
import * as React from 'react'
import { findNodeHandle, StyleSheet, Text, View } from 'react-native'
import { Props as LayerIlloProps } from 'src/dev/LayersIllo'
import StackSection from 'src/dev/StackSection'
import { H2, H3, H4, Li } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import Octocat from 'src/icons/Octocat'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN } from 'src/shared/Button.3'
import { CeloLinks, hashNav } from 'src/shared/menu-items'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import { scrollTo } from 'src/utils/utils'
const LayersIllo = dynamic(
  (import('src/dev/LayersIllo') as unknown) as Promise<React.ComponentType<LayerIlloProps>>
)

enum Levels {
  apps,
  contracts,
  blockchains,
  code,
}

enum StickyMode {
  'normal',
  'attachToBottom',
  'fixed',
}

interface State {
  selection: Levels
  mode: StickyMode
}

const GLASS_CEILING = 160

class FullStack extends React.PureComponent<I18nProps & ScreenProps, State> {
  state = { selection: Levels.apps, mode: StickyMode.normal }

  ref = React.createRef<View>()
  illoRef = React.createRef<View>()

  handleScroll = throttle(() => {
    if (!(this.props.screen === ScreenSizes.DESKTOP)) {
      this.setState({ mode: StickyMode.normal })
      return
    }

    const element: any = findNodeHandle(this.ref.current)
    if (!element) {
      return
    }

    const clientRect: DOMRect = element.getBoundingClientRect()

    if (clientRect.top < HEADER_HEIGHT - 100) {
      this.illoRef.current.measure((_x, _y, _w, illoHeight) => {
        this.autoSetHighlight(clientRect, illoHeight)

        if (clientRect.bottom - illoHeight < 100) {
          this.setState({ mode: StickyMode.attachToBottom })
        } else {
          this.setState({ mode: StickyMode.fixed })
        }
      })
    } else {
      this.setState({ mode: StickyMode.normal })
    }
  }, 24)

  setL1 = () => {
    this.setState({ selection: Levels.apps })
  }

  setL2 = () => {
    this.setState({ selection: Levels.contracts })
  }

  setL3 = () => {
    this.setState({ selection: Levels.blockchains })
  }

  setCode = () => {
    this.setState({ selection: Levels.code })
  }

  setLevel = (level: Levels) => {
    this.setState({ selection: level })
  }

  scrollTo = (level: Levels) => {
    switch (level) {
      case Levels.apps:
        scrollTo(hashNav.build.applications)
        break
      case Levels.contracts:
        scrollTo(hashNav.build.contracts)
        break
      case Levels.blockchains:
        scrollTo(hashNav.build.blockchain)
        break
    }
  }

  autoSetHighlight(clientRect: DOMRect, illoHeight: number) {
    requestAnimationFrame(() => {
      const partial = clientRect.height / 4
      const amountPastGlassTop = clientRect.y - HEADER_HEIGHT
      const highestOffScreen = GLASS_CEILING + amountPastGlassTop < 0
      const shouldTurnOnLevelOne = GLASS_CEILING + partial + amountPastGlassTop < 0

      if (clientRect.bottom - illoHeight - partial + GLASS_CEILING < 0) {
        this.setCode()
      } else if (shouldTurnOnLevelOne) {
        this.setL3()
      } else if (highestOffScreen) {
        this.setL2()
      } else {
        this.setL1()
      }
    })
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  }

  modeStyle = () => {
    switch (this.state.mode) {
      case StickyMode.fixed:
        return styles.sticky
      case StickyMode.attachToBottom:
        return styles.attachToBottom
      default:
        return false
    }
  }

  render() {
    const { t, screen } = this.props
    const isDesktop = screen === ScreenSizes.DESKTOP
    const isBrowseCodeFaded = isDesktop && !(this.state.selection === Levels.code)

    const activeLayer = this.state.selection === Levels.code ? 'all' : this.state.selection

    return (
      <View style={standardStyles.darkBackground} ref={this.ref}>
        <GridRow
          desktopStyle={standardStyles.sectionMarginTop}
          tabletStyle={[standardStyles.sectionMarginTopTablet, styles.tabletContainer]}
          mobileStyle={standardStyles.sectionMarginTopMobile}
          allStyle={styles.container}
        >
          <Cell span={Spans.half} tabletSpan={Spans.full}>
            <View style={this.modeStyle()} ref={this.illoRef}>
              <View style={styles.illoContainer}>
                <H2 style={textStyles.invert}>{t('stackSubtitle')}</H2>
                <H3 style={[textStyles.invert, standardStyles.elementalMargin]}>
                  {t('stackTitle')}
                </H3>
                <Text style={[fonts.p, textStyles.invert, standardStyles.elementalMarginBottom]}>
                  {t('stackDescription')}
                </Text>
                {isDesktop && (
                  <LayersIllo activeLayer={activeLayer} onSelectLayer={this.setLevel} />
                )}
              </View>
            </View>
          </Cell>
          <Cell
            span={Spans.half}
            tabletSpan={Spans.full}
            style={isDesktop && styles.stackContainer}
          >
            <StackSection
              onPress={this.setL1}
              id={hashNav.build.applications}
              isSelected={this.state.selection === Levels.apps || !isDesktop}
              title={t('mobile.title')}
              text={t('mobile.text')}
              buttonOne={{ title: t('installWallet'), href: CeloLinks.walletApp }}
              buttonTwo={{ title: t('seeCode'), href: CeloLinks.monorepo }}
            >
              <Li style={textStyles.invert}>{t('mobile.nonCustodial')}</Li>
              <Li style={textStyles.invert}>{t('mobile.mobileUltra')}</Li>
              <Li style={textStyles.invert}>{t('mobile.exchange')}</Li>
              <Li style={textStyles.invert}>{t('mobile.qr')}</Li>
              <Li style={textStyles.invert}>{t('mobile.sdk')}</Li>
            </StackSection>
            <StackSection
              onPress={this.setL2}
              id={hashNav.build.contracts}
              isSelected={this.state.selection === Levels.contracts || !isDesktop}
              title={t('protocol.title')}
              text={t('protocol.text')}
              buttonOne={{ title: t('readMore'), href: CeloLinks.docsOverview }}
              buttonTwo={{ title: t('seeCode'), href: CeloLinks.monorepo }}
            >
              <Li style={textStyles.invert}>{t('protocol.algoReserve')}</Li>
              <Li style={textStyles.invert}>{t('protocol.cryptoCollat')}</Li>
              <Li style={textStyles.invert}>{t('protocol.native')}</Li>
            </StackSection>
            <StackSection
              onPress={this.setL3}
              id={hashNav.build.blockchain}
              isSelected={this.state.selection === Levels.blockchains || !isDesktop}
              title={t('proof.title')}
              text={t('proof.text')}
              buttonOne={{ title: t('readMore'), href: CeloLinks.docsOverview }}
              buttonTwo={{ title: t('seeCode'), href: CeloLinks.blockChainRepo }}
            >
              <Li style={textStyles.invert}>{t('proof.permissionless')}</Li>
              <Li style={textStyles.invert}>{t('proof.rewardsWeighted')}</Li>
              <Li style={textStyles.invert}>{t('proof.onChain')}</Li>
            </StackSection>
            <View
              style={[
                standardStyles.centered,
                styles.browseCodeArea,
                isDesktop && standardStyles.blockMargin,
                isBrowseCodeFaded && styles.faded,
              ]}
            >
              <H4 style={[textStyles.invert, textStyles.center]}>{t('stackBrowseTitle')}</H4>
              <Text
                style={[
                  standardStyles.elementalMarginBottom,
                  fonts.legal,
                  textStyles.invert,
                  textStyles.center,
                ]}
              >
                {t('stackBrowseCopy')}{' '}
              </Text>
              <Button
                disabled={isBrowseCodeFaded}
                kind={BTN.PRIMARY}
                text={t('stackBrowseButton')}
                target="_blank"
                href={CeloLinks.gitHub}
                iconRight={<Octocat color={colors.white} size={20} />}
              />
            </View>
          </Cell>
        </GridRow>
      </View>
    )
  }
}

export default withScreenSize(withNamespaces('dev')(FullStack))

const styles = StyleSheet.create({
  container: { overflow: 'hidden', flexWrap: 'wrap' },
  tabletContainer: { justifyContent: 'flex-end' },
  sticky: {
    position: 'fixed',
    top: HEADER_HEIGHT,
    zIndex: 10,
  },
  attachToBottom: {
    bottom: 0,
    paddingTop: HEADER_HEIGHT,
    position: 'absolute',
  },
  illoContainer: { width: '100%', maxWidth: 400 },
  stackContainer: { paddingTop: GLASS_CEILING },
  faded: {
    opacity: 0.6,
  },
  browseCodeArea: {
    transitionProperty: 'opacity' as 'opacity',
    transitionDuration: '100ms',
    zIndex: 1,
  },
})
