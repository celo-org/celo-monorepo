import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { RequestType } from 'src/fauceting/FaucetInterfaces'
import RequestFunds from 'src/fauceting/RequestFunds'
import { RequestState } from 'src/fauceting/utils'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import SideTitledSection from 'src/layout/SideTitledSection'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import InlineAnchor from 'src/shared/InlineAnchor'
import { CeloLinks } from 'src/shared/menu-items'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
interface State {
  address: string
  requestState: RequestState
  isCaptchaValid: boolean
}

class FaucetPage extends React.Component<I18nProps, State> {
  static getInitialProps = () => {
    return {
      namespacesRequired: [NameSpaces.faucet, NameSpaces.common],
    }
  }

  render() {
    const { t } = this.props

    return (
      <>
        <OpenGraph
          title={t('pageTitle')}
          path={CeloLinks.faucet}
          description={t('description')}
          image={require('src/fauceting/ogimage-faucet.png')}
        />
        <View style={styles.container}>
          <H1 style={[textStyles.center, standardStyles.sectionMarginTablet]}>{t('title')}</H1>
          <SideTitledSection title={t('addFunds')} text={t('addFundsText')}>
            <RequestFunds kind={RequestType.Faucet} />
          </SideTitledSection>
          <SideTitledSection
            title={t('getTestnetAddress')}
            text={
              <Trans ns={NameSpaces.faucet} i18nKey={'getTestnetText'}>
                <InlineAnchor href={CeloLinks.walletApp}>INVITE</InlineAnchor>{' '}
                <InlineAnchor href={CeloLinks.tutorial}>CLI</InlineAnchor>
              </Trans>
            }
          />
          <SideTitledSection
            title={t('haveAnAccount')}
            text={
              <Trans ns={NameSpaces.faucet} i18nKey={'haveAccountText'}>
                You can access an existing account from the Celo Wallet by pressing `Import It` on
                the first screen and entering your seed phrase.
              </Trans>
            }
          />
          <SideTitledSection title={t('hittingIssues')}>
            <ContentWithCTA
              emphasis={t('askQustionsOnForum')}
              text={t('findAnswers')}
              btnText={t('testnetForum')}
              href={CeloLinks.discourse}
            />
          </SideTitledSection>
          <SideTitledSection title={t('whatsNext')}>
            <ContentWithCTA
              emphasis={t('buildLocally')}
              text={t('buildLocallyText')}
              btnText={t('buildLocallyLink')}
              href={CeloLinks.buildWalletDocs}
            />
            <ContentWithCTA
              emphasis={t('viewAccountInfo')}
              text={t('checkYourBalance')}
              btnText={t('BlockScout')}
              href={CeloLinks.alfajoresBlockscout}
            />
            <ContentWithCTA
              emphasis={t('interestedInNode')}
              text={t('interestedInNodeText')}
              btnText={t('learnMore')}
              href={CeloLinks.nodeDocs}
            />
          </SideTitledSection>
        </View>
      </>
    )
  }
}

function ContentWithCTA({ emphasis, text, btnText, href }) {
  return (
    <View style={standardStyles.elementalMarginBottom}>
      <Text style={[fonts.p, styles.content]}>
        <Text style={textStyles.heavy}>{emphasis} </Text>
        {text}
      </Text>
      <Button text={btnText} href={href} kind={BTN.NAKED} size={SIZE.normal} />
    </View>
  )
}

export default withNamespaces(NameSpaces.faucet)(FaucetPage)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
  },
  content: {
    paddingBottom: 10,
  },
  buttonContainer: {
    alignItems: 'flex-start',
  },
  errorBorder: {
    borderColor: colors.error,
  },
})
