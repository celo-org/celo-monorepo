import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import defaultContent from 'src/../static/locales/en/codeofconduct.json'
import { IntegratingAnimation } from 'src/community/connect/CodeOfConduct'
import { H1, Li, Ul } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, Trans, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import SideTitledSection from 'src/layout/SideTitledSection'
import Button, { BTN } from 'src/shared/Button.3'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { standardStyles, textStyles } from 'src/styles'
export class CodeOfConduct extends React.Component<I18nProps> {
  static getInitialProps = () => {
    return { namespacesRequired: ['codeofconduct'] }
  }

  render() {
    const { t } = this.props

    return (
      <>
        <OpenGraph title={t('Title')} path={'/code-of-conduct'} description={t('Purpose Text')} />
        <View style={styles.container}>
          <GridRow
            allStyle={standardStyles.centered}
            desktopStyle={standardStyles.blockMarginBottom}
            tabletStyle={standardStyles.blockMarginBottomTablet}
            mobileStyle={standardStyles.blockMarginBottomMobile}
          >
            <Cell span={Spans.three4th} style={standardStyles.centered}>
              <View style={styles.animation}>
                <IntegratingAnimation darkMode={false} />
              </View>
              <H1 style={textStyles.center}>{t('Title')}</H1>
            </Cell>
          </GridRow>
          <SideTitledSection title={t('Purpose')} text={t('PurposeText')} />
          <SideTitledSection
            title={t('OpenSource')}
            text={
              <Trans i18nKey={'OpenSourceText'}>
                {
                  'A supplemental goal of this Code of Conduct is to increase open source citizenship by encouraging participants to recognize and strengthen the relationships between our actions and their effects on our community.\n\n Communities mirror the societies in which they exist and positive action is essential to counteract the many forms of inequality and abuses of power that exist in society.\n\n If you see someone who is making an extra effort to ensure our community is welcoming, friendly, and encourages all participants to contribute to the fullest extent, let us know by email '
                }
                <CommunityEmail />.
              </Trans>
            }
          />
          <SideTitledSection title={t('Scope')} text={t('ScopeText')} />
          <SideTitledSection title={t('ExpectedBehavior')} text={t('ExpectedBehaviorText')}>
            <Ul>
              {defaultContent.BehaviorsBullets.map((bullet) => {
                return <Li key={bullet}>{t(bullet)}</Li>
              })}
            </Ul>
          </SideTitledSection>
          <SideTitledSection title={t('UnacceptableBehavior')} text={t('UnacceptableBehaviorText')}>
            <Ul>
              {defaultContent.UnacceptableBehaviorsBullets.map((bullet) => {
                return <Li key={bullet}>{t(bullet)}</Li>
              })}
            </Ul>
          </SideTitledSection>
          <SideTitledSection title={t('Consequences')} text={t('ConsequencesText')} />
          <SideTitledSection
            title={t('Reporting')}
            text={
              <Trans i18nKey="ReportingText">
                If you are subject to or witness unacceptable behavior, or have any other concerns,
                please notify <CommunityEmail /> as soon as possible.
              </Trans>
            }
          />
          <SideTitledSection
            title={t('Grievances')}
            text={
              <Trans i18nKey="GrievancesText">
                If you feel you have been falsely or unfairly accused of violating this Code of
                Conduct, you should notify <CommunityEmail /> with a concise description of your
                grievance.
              </Trans>
            }
          />
          <SideTitledSection
            title={t('License')}
            text={
              <Trans i18nKey={'LicenseText'}>
                This Code of Conduct is distributed under a{' '}
                <Button
                  href={'https://creativecommons.org/licenses/by-sa/3.0/'}
                  text="Creative Commons Attribution-ShareAlike"
                  kind={BTN.INLINE}
                  target={'_new'}
                />{' '}
                license. Portions of text derived from the{' '}
                <Button
                  href={'http://citizencodeofconduct.org/'}
                  text="Citizen Code of Conduct"
                  kind={BTN.INLINE}
                  target={'_new'}
                />{' '}
                , the{' '}
                <Button
                  href={'https://www.djangoproject.com/conduct/'}
                  text="Django Code of Conduct"
                  kind={BTN.INLINE}
                  target={'_new'}
                />
                , the{' '}
                <Button
                  href={'http://geekfeminism.wikia.com/wiki/Community_anti-harassment'}
                  text="Geek Feminism Anti-Harassment Policy"
                  kind={BTN.INLINE}
                  target={'_new'}
                />, and the{' '}
                <Button
                  href={'https://www.contributor-covenant.org/version/1/4/code-of-conduct.html'}
                  text="Contributor Covenant"
                  kind={BTN.INLINE}
                  target={'_new'}
                />.
              </Trans>
            }
          />
          <SideTitledSection title={''} text={t('LastUpdated')} />
        </View>
      </>
    )
  }
}

function CommunityEmail() {
  return (
    <Button
      href={'mailto:community@celo.org'}
      text="community@celo.org"
      kind={BTN.INLINE}
      target={'_new'}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
  },
  animation: {
    width: 241,
    height: 90,
    marginBottom: 100,
  },
})

export default withNamespaces('codeofconduct')(CodeOfConduct)
