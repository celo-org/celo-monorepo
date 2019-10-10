import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import LayersIllo from 'src/dev/LayersIllo'
import { H2, H3, Li } from 'src/fonts/Fonts'
import StackSection from 'src/dev/StackSection'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import throttle from 'lodash.throttle'

import { CeloLinks, hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles, textStyles, colors } from 'src/styles'
enum Levels {
  apps,
  contracts,
  blockchains,
}

interface State {
  selection: Levels
}

class FullStack extends React.PureComponent<I18nProps, State> {
  state = { selection: Levels.apps }

  handleScroll = throttle((event) => {
    debugger
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

  setLevel = (level: Levels) => {
    this.setState({ selection: level })
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  }

  render() {
    const { t } = this.props

    return (
      <View style={standardStyles.darkBackground}>
        <GridRow>
          <Cell span={Spans.half}>
            <H3 style={textStyles.invert}>{t('stackSubtitle')}</H3>
            <H2 style={[textStyles.invert, standardStyles.elementalMargin]}>{t('stackTitle')}</H2>
          </Cell>
        </GridRow>
        <GridRow allStyle={{ overflow: 'hidden' }}>
          <Cell span={Spans.half}>
            <View style={{ width: '100%', maxWidth: 400 }}>
              <Text style={[fonts.p, textStyles.invert, standardStyles.elementalMarginBottom]}>
                {t('stackDescription')}
              </Text>
              <LayersIllo activeLayer={this.state.selection} onSelectLayer={this.setLevel} />
            </View>
          </Cell>
          <Cell span={Spans.half}>
            <StackSection
              onPress={this.setL1}
              id={hashNav.build.applications}
              isSelected={this.state.selection === Levels.apps}
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
              isSelected={this.state.selection === Levels.contracts}
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
              isSelected={this.state.selection === Levels.blockchains}
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

export default withNamespaces('dev')(FullStack)

const styles = StyleSheet.create({})
