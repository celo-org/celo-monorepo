import * as React from 'react'
import { View } from 'react-native'
import Cover from 'src/dev/Cover'
import DeveloperUpdates from 'src/dev/DeveloperUpdates'
import Features from 'src/dev/Features'
import StackExplorer from 'src/dev/FullStack'
import StackSection from 'src/dev/StackSection'
import Title from 'src/dev/Title'
import { Li } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, withNamespaces } from 'src/i18n'
import menuItems, { CeloLinks, hashNav } from 'src/shared/menu-items'
import { standardStyles, textStyles } from 'src/styles'

class BuildPage extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: ['common', 'dev'] }
  }

  render() {
    const { t } = this.props
    return (
      <View>
        <OpenGraph
          path={menuItems.BUILD.link}
          title={'Build with Celo | Celo Developers'}
          description={
            "Documentation for Celo's open-source protocol. Celo is a proof-of-stake based blockchain with smart contracts that allows for an ecosystem of powerful applications built on top."
          }
        />
        <Cover />
        <StackExplorer />
        <View style={standardStyles.darkBackground}>
          <Features />
          <Title nativeID={hashNav.build.stack} invert={true} title={t('celoStack')} />
          <StackSection
            label="1"
            id={hashNav.build.applications}
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
            label="2"
            id={hashNav.build.contracts}
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
            label="3"
            id={hashNav.build.blockchain}
            title={t('proof.title')}
            text={t('proof.text')}
            buttonOne={{ title: t('readMore'), href: CeloLinks.docsOverview }}
            buttonTwo={{ title: t('seeCode'), href: CeloLinks.blockChainRepo }}
          >
            <Li style={textStyles.invert}>{t('proof.permissionless')}</Li>
            <Li style={textStyles.invert}>{t('proof.rewardsWeighted')}</Li>
            <Li style={textStyles.invert}>{t('proof.onChain')}</Li>
          </StackSection>
        </View>
        <DeveloperUpdates />
      </View>
    )
  }
}

export default withNamespaces('dev')(BuildPage)
