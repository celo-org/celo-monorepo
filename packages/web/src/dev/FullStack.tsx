import throttle from 'lodash.throttle'
import * as React from 'react'
import { findNodeHandle, StyleSheet, Text, View } from 'react-native'
import LayersIllo from 'src/dev/LayersIllo'
import StackSection from 'src/dev/StackSection'
import { H2, H3, Li } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { scrollTo } from 'src/utils/utils'
import { CeloLinks, hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles, textStyles, colors } from 'src/styles'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { withScreenSize, ScreenProps, ScreenSizes } from 'src/layout/ScreenSize'

enum Levels {
  apps,
  contracts,
  blockchains,
}

interface State {
  selection: Levels
  sticky: boolean
}

const GLASS_CEILING = 160

class FullStack extends React.PureComponent<I18nProps & ScreenProps, State> {
  state = { selection: Levels.apps, sticky: false }

  ref = React.createRef<View>()

  handleScroll = throttle(() => {
    if (!(this.props.screen === ScreenSizes.DESKTOP)) {
      this.setState({ sticky: false })
      return
    }

    const element: any = findNodeHandle(this.ref.current)
    if (!element) {
      return
    }
    const clientRect: DOMRect = element.getBoundingClientRect()
    const currentOffset = clientRect.top

    if (currentOffset < HEADER_HEIGHT) {
      requestAnimationFrame(() => {
        const third = clientRect.height / 3

        const amountPastGlassTop = clientRect.y - HEADER_HEIGHT
        const hardTop = GLASS_CEILING

        const highestOffScreen = hardTop + amountPastGlassTop < 0
        const shouldTurnOnLevelOne = hardTop + third + amountPastGlassTop < 0

        if (shouldTurnOnLevelOne) {
          this.setL1()
        } else if (highestOffScreen) {
          this.setL2()
        } else {
          this.setL3()
        }
      })

      this.setState({ sticky: true })
    } else {
      this.setState({ sticky: false })
    }
  }, 24)

  setL3 = () => {
    this.setState({ selection: Levels.apps })
  }

  setL2 = () => {
    this.setState({ selection: Levels.contracts })
  }

  setL1 = () => {
    this.setState({ selection: Levels.blockchains })
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

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  }

  render() {
    const { t, screen } = this.props
    const isDesktop = screen === ScreenSizes.DESKTOP
    return (
      <View style={standardStyles.darkBackground} ref={this.ref}>
        <GridRow tabletStyle={styles.tabletContainer} allStyle={styles.container}>
          <Cell span={Spans.half} tabletSpan={Spans.full}>
            <View style={this.state.sticky && styles.sticky}>
              <View style={styles.illoContainer}>
                <H3 style={textStyles.invert}>{t('stackSubtitle')}</H3>
                <H2 style={[textStyles.invert, standardStyles.elementalMargin]}>
                  {t('stackTitle')}
                </H2>
                <Text style={[fonts.p, textStyles.invert, standardStyles.elementalMarginBottom]}>
                  {t('stackDescription')}
                </Text>
                {isDesktop && (
                  <LayersIllo activeLayer={this.state.selection} onSelectLayer={this.setLevel} />
                )}
              </View>
            </View>
          </Cell>
          <Cell
            span={Spans.half}
            tabletSpan={Spans.three4th}
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
    // @ts-ignore
    position: 'fixed',
    top: HEADER_HEIGHT,
    zIndex: 10,
  },
  illoContainer: { width: '100%', maxWidth: 400 },
  stackContainer: { paddingTop: GLASS_CEILING },
})
