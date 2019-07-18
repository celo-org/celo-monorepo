import getConfig from 'next/config'
import * as React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import { TextInput } from 'src/forms/FormComponents'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import SideTitledSection from 'src/layout/SideTitledSection'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { postForm } from 'src/shared/Form'
import { CeloLinks } from 'src/shared/menu-items'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import { RequestStatus } from '../../server/FirebaseClient'

enum RequestState {
  Initial,
  Invalid,
  Started,
  Completed,
  Failed,
}

interface State {
  address: string
  requestState: RequestState
  isCaptchaValid: boolean
}

function faucet({ captchaToken, address }) {
  return postForm('/faucet', { captchaToken, beneficiary: address })
}

class FaucetPage extends React.Component<I18nProps, State> {
  static getInitialProps = () => {
    return {
      namespacesRequired: [NameSpaces.faucet, NameSpaces.common],
    }
  }
  recaptchaRef = React.createRef<ReCAPTCHA>()

  state = {
    address: '',
    requestState: RequestState.Initial,
    isCaptchaValid: false,
  }

  onTyping = ({ nativeEvent }) => {
    const { value } = nativeEvent.target
    this.setState({
      address: value,
      requestState:
        this.state.requestState !== RequestState.Started
          ? RequestState.Initial
          : this.state.requestState,
    })
  }

  onCaptcha = (value: string | null) => {
    this.setState({ isCaptchaValid: !!value })
  }

  requestFaucet = async () => {
    if (!(this.state.address.length > 0)) {
      this.setState({ requestState: RequestState.Invalid })
      return
    }

    this.setState({ requestState: RequestState.Started })

    const captchaToken = this.recaptchaRef.current.getValue()
    const res = await faucet({ captchaToken, address: this.state.address })
    const status = (await res.json()).status as RequestStatus

    if (status === RequestStatus.Done) {
      this.setState({ requestState: RequestState.Completed })
    } else {
      this.setState({ requestState: RequestState.Failed })
    }
  }

  getCaptchaKey = () => {
    return getConfig().publicRuntimeConfig.RECAPTCHA
  }

  render() {
    const { t } = this.props
    const { requestState } = this.state
    const hasFailed = requestState === RequestState.Failed
    const isInvalid = requestState === RequestState.Invalid
    const isComplete = requestState === RequestState.Completed
    const isStarted = this.state.requestState === RequestState.Started

    return (
      <>
        <OpenGraph title={t('pageTitle')} path={'/dev/faucet'} description={t('description')} />
        <View style={styles.container}>
          <H1 style={[textStyles.center, standardStyles.sectionMarginTablet]}>{t('title')}</H1>
          <SideTitledSection title={t('addFunds')} text={t('addFundsText')}>
            <View style={standardStyles.elementalMargin}>
              <ReCAPTCHA
                sitekey={this.getCaptchaKey()}
                onChange={this.onCaptcha}
                ref={this.recaptchaRef}
              />
            </View>
            <TextInput
              style={[
                fonts.p,
                standardStyles.input,
                standardStyles.elementalMarginTop,
                (isInvalid || hasFailed) && styles.errorBorder,
              ]}
              focusStyle={standardStyles.inputFocused}
              onChange={this.onTyping}
              placeholder={t('Testnet Address')}
              placeholderTextColor={colors.placeholderGray}
              name="address"
              type="text"
              value={this.state.address}
            />
            <ContextualInfo requestState={requestState} t={this.props.t} />
            <View style={styles.buttonContainer}>
              <Button
                kind={isComplete ? BTN.SECONDARY : BTN.PRIMARY}
                text={isComplete ? t('funded') : t('getDollars')}
                onPress={this.requestFaucet}
                iconLeft={isStarted && <ActivityIndicator color={colors.primary} size={'large'} />}
                disabled={!this.state.isCaptchaValid}
              />
            </View>
          </SideTitledSection>
          <SideTitledSection
            title={t('getTestnetAddress')}
            text={
              <Trans i18nKey={'getTestnetText'}>
                <Link href={CeloLinks.walletApp}>INVITE</Link>{' '}
                <Link href={CeloLinks.tutorial}>CLI</Link>
              </Trans>
            }
          />
          <SideTitledSection
            title={t('haveAnAccount')}
            text={
              <Trans i18nKey={'haveAccountText'}>
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
              href={CeloLinks.blockscout}
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

interface InfoProps {
  requestState: RequestState
  t: I18nProps['t']
}

function ContextualInfo({ requestState, t }: InfoProps) {
  const contextStyle = [RequestState.Failed, RequestState.Invalid].includes(requestState)
    ? [fonts.small, textStyles.error, standardStyles.elementalMarginBottom]
    : standardStyles.elementalMarginBottom

  const text =
    {
      [RequestState.Failed]: t('faucetError'),
      [RequestState.Invalid]: t('invalidAddress'),
      [RequestState.Completed]: t('faucetCompleted'),
    }[requestState] || 'eg. 0xce10....'

  return <Text style={contextStyle}>{text}</Text>
}

function Link({ children, href }) {
  return <Button kind={BTN.INLINE} text={children} href={href} />
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
