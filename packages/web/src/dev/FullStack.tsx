import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import LayersIllo from 'src/dev/LayersIllo'
import { APPLICATIONS_ID, PROOF_ID, PROTOCOL_ID } from 'src/dev/sectionIDs'
import Title from 'src/dev/Title'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import { scrollTo as jumpTo } from 'src/utils/utils'

enum Levels {
  mobile,
  protocol,
  proof,
}

interface State {
  selection: Levels
}

class FullStack extends React.PureComponent<I18nProps, State> {
  state = { selection: Levels.mobile }
  setMobile = () => {
    this.setState({ selection: Levels.mobile })
  }

  setProtocol = () => {
    this.setState({ selection: Levels.protocol })
  }
  setProof = () => {
    this.setState({ selection: Levels.proof })
  }

  setLevel = (level: Levels) => {
    this.setState({ selection: level })
  }

  render() {
    const { t } = this.props
    const { selection } = this.state
    const isMobileSelected = selection === Levels.mobile
    const isProtocol = selection === Levels.protocol
    const isProof = selection === Levels.proof
    return (
      <Fade bottom={true} distance={'50px'}>
        <View>
          <Title title={t('techTitle')} />
          <GridRow
            desktopStyle={standardStyles.sectionMarginBottom}
            tabletStyle={standardStyles.sectionMarginBottomTablet}
            mobileStyle={standardStyles.sectionMarginBottomMobile}
          >
            <Cell span={Spans.fourth} tabletSpan={Spans.third}>
              <Text style={fonts.p}>{t('fullStackText')}</Text>
            </Cell>
            <Cell span={Spans.half} tabletSpan={Spans.third} style={styles.illo}>
              <LayersIllo onSelectLayer={this.setLevel} activeLayer={selection} />
            </Cell>
            <Cell span={Spans.fourth} tabletSpan={Spans.third} style={styles.indicators}>
              <LevelSelection
                active={isMobileSelected}
                onPressTitle={this.setMobile}
                onPressButton={jumpToMobile}
                btnText={t('learnMore')}
                text={t('levelLabel.mobileText')}
              >
                {t(`levelLabel.mobile`)}
              </LevelSelection>
              <LevelSelection
                active={isProtocol}
                onPressTitle={this.setProtocol}
                onPressButton={jumpToProtocol}
                btnText={t('learnMore')}
                text={t('levelLabel.protocolText')}
              >
                {t(`levelLabel.protocol`)}
              </LevelSelection>
              <LevelSelection
                active={isProof}
                onPressTitle={this.setProof}
                onPressButton={jumpToProof}
                btnText={t('learnMore')}
                text={t('levelLabel.proofText')}
              >
                {t(`levelLabel.proof`)}
              </LevelSelection>
            </Cell>
          </GridRow>
        </View>
      </Fade>
    )
  }
}

function jumpToProof() {
  jumpTo(PROOF_ID, 'center')
}
function jumpToProtocol() {
  jumpTo(PROTOCOL_ID, 'center')
}

function jumpToMobile() {
  jumpTo(APPLICATIONS_ID)
}

interface LevelSelectionProps {
  active: boolean
  children: React.ReactNode
  onPressTitle: () => void
  onPressButton: () => void
  text: string
  btnText: string
}

const LevelSelection = withScreenSize<LevelSelectionProps & ScreenProps>(
  function LevelSelectionComponent({
    active,
    children,
    onPressTitle,
    text,
    btnText,
    onPressButton,
    screen,
  }) {
    return (
      <View
        style={[
          standardStyles.row,
          standardStyles.elementalMarginBottom,
          screen === ScreenSizes.DESKTOP && styles.levelSection,
        ]}
      >
        <View style={styles.iconColumn}>
          {active && (
            <Fade>
              <OvalCoin size={12} color={colors.primary} />
            </Fade>
          )}
        </View>
        <View style={styles.titleArea}>
          <Text
            style={[
              fonts.a,
              styles.levelSectionTitle,
              textStyles.medium,
              active ? {} : styles.levelSectionTitleInactive,
            ]}
            onPress={onPressTitle}
          >
            {children}
          </Text>
          {active && (
            <Fade>
              <View>
                <Text style={[fonts.legal, styles.microText]}>{text}</Text>
                <Button text={btnText} kind={BTN.NAKED} onPress={onPressButton} />
              </View>
            </Fade>
          )}
        </View>
      </View>
    )
  }
)

export default withNamespaces('dev')(FullStack)

const styles = StyleSheet.create({
  illo: {
    paddingHorizontal: 10,
  },
  container: {
    flexWrap: 'wrap',
    flex: 1,
  },
  indicators: {
    justifyContent: 'space-between',
  },
  levelSectionTitle: {
    transitionProperty: 'color',
    transitionDuration: '1500ms',
  },
  levelSectionTitleInactive: {
    color: colors.secondary,
  },
  levelSection: {
    minHeight: 100,
    height: '30%',
  },
  microText: {
    marginVertical: 10,
  },
  titleArea: {
    flex: 1,
  },
  iconColumn: {
    width: 8,
    marginRight: 12,
    marginTop: 2,
  },
})
