import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import FellowshipForm from 'src/community/connect/FellowshipForm'
import FellowViewer from 'src/community/connect/FellowViewer'
import QuarterCircle from 'src/community/connect/QuarterCircle'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import { colors, standardStyles, textStyles } from 'src/styles'

class FellowSection extends React.PureComponent<I18nProps> {
  render() {
    const { t } = this.props
    return (
      <>
        <View style={[styles.darkBackground, styles.keepOnScreen]}>
          <span id={'fellowship'} />
          <GridRow mobileStyle={[styles.proposalArea, standardStyles.blockMarginBottomTablet]}>
            <Cell span={Spans.half} style={styles.verticalCenter}>
              <View style={styles.proposalText}>
                <H2 style={[textStyles.invert, standardStyles.elementalMarginBottom]}>
                  {t('fellows.title')}
                </H2>
                <Button
                  kind={BTN.NAKED}
                  text={t('fellows.button')}
                  target={'_cfp'}
                  href={
                    'https://medium.com/celohq/call-for-proposals-the-celo-fellowship-3c43b06b10f9'
                  }
                />
              </View>
            </Cell>
            <Cell span={Spans.half} style={styles.maskedCircle}>
              <QuarterCircle />
            </Cell>
          </GridRow>
        </View>
        <FellowViewer />
        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={[standardStyles.sectionMarginTop, standardStyles.blockMarginBottom]}
          tabletStyle={[standardStyles.sectionMarginTablet, standardStyles.blockMarginBottomTablet]}
          mobileStyle={[standardStyles.sectionMarginMobile, standardStyles.blockMarginBottomMobile]}
        >
          <Cell span={Spans.three4th} style={standardStyles.centered}>
            <Fade bottom={true} distance={'20px'}>
              <H2 style={[textStyles.center]}>{t('fellows.formTitle')}</H2>
            </Fade>
          </Cell>
        </GridRow>
        <Fade bottom={true} distance={'20px'}>
          <View>
            <FellowshipForm />
          </View>
        </Fade>
      </>
    )
  }
}

export default withNamespaces('community')(FellowSection)

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: colors.dark,
  },
  maskedCircle: {
    paddingTop: 0,
    paddingLeft: 100,
  },
  keepOnScreen: {
    overflow: 'hidden',
    maxWidth: '100vw',
  },
  proposalArea: { flexDirection: 'column-reverse' },
  proposalText: { paddingLeft: '4%' },
  verticalCenter: { justifyContent: 'center' },
})
