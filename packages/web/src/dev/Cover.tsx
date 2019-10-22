import dynamic from 'next/dynamic'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import CoverActions from 'src/dev/CoverActions'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import Android from 'src/icons/Android'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { CeloLinks } from 'src/shared/menu-items'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles } from 'src/styles'
import LeaderBoard from 'src/dev/LeaderBoard'
const DELAY = 400
const DELAY_2 = DELAY * 1.3
const DURATION = 400

const LEADERS = [
  { points: 83, identity: 'Rex' },
  { points: 840, identity: '100%_that_validator_who_is_an_absolute_diva' },
  { points: 321, identity: 'Heisenberg' },
  { points: 380, identity: 'Harry' },
  { points: 764, identity: 'DX-West' },
  { points: 500, identity: 'Simone2148' },
  { points: 497, identity: '$celo-$' },
  { points: 1020, identity: '77zepher' },
  { points: 940, identity: 'Gatsby & Durben' },
]

const CoverComponent = React.memo(function Cover({ t }: I18nProps) {
  return (
    <View style={styles.cover}>
      <GridRow>
        <Cell span={Spans.full}>
          <LeaderBoard leaders={LEADERS} />
        </Cell>
      </GridRow>
      <GridRow
        allStyle={standardStyles.centered}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
      >
        <Cell span={Spans.three4th} style={[standardStyles.centered]}>
          <H1
            style={[
              textStyles.center,
              textStyles.invert,
              standardStyles.blockMarginTopTablet,
              standardStyles.elementalMarginBottom,
            ]}
          >
            {t('buildCoverTitle')}
          </H1>

          <H4 style={[textStyles.center, textStyles.invert, standardStyles.elementalMarginBottom]}>
            <Fade ssrReveal={true} delay={DELAY} duration={DURATION}>
              {t('buildCoverSubtitle')}
            </Fade>
          </H4>
          <Fade ssrReveal={true} delay={DELAY} duration={DURATION}>
            <View style={styles.buttons}>
              <View style={[standardStyles.elementalMargin, styles.button]}>
                <Button
                  iconRight={<Android size={18} />}
                  text={t('getStarted')}
                  kind={BTN.PRIMARY}
                  size={SIZE.big}
                  href={CeloLinks.walletApp}
                />
              </View>
              <View style={[standardStyles.elementalMargin, styles.button]}>
                <Button
                  text={t('exploreCLI')}
                  kind={BTN.NAKED}
                  size={SIZE.big}
                  align="center"
                  href={CeloLinks.tutorial}
                />
              </View>
            </View>
          </Fade>
        </Cell>
      </GridRow>
      <Fade ssrReveal={true} delay={DELAY_2} duration={DURATION} bottom={true} distance={'40px'}>
        <View>
          <CoverActions />
        </View>
      </Fade>
    </View>
  )
})

const styles = StyleSheet.create({
  buttons: {
    flex: 1,
    maxWidth: '100vw',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cover: {
    marginTop: HEADER_HEIGHT,
    backgroundColor: colors.dark,
    maxWidth: '100vw',
    overflow: 'hidden',
  },
  phone: {
    height: '27vh',
    minHeight: 250,
    marginTop: HEADER_HEIGHT,
  },
  gap: {
    width: 20,
  },
  button: {
    marginHorizontal: 10,
  },
})

export default withNamespaces('dev')(CoverComponent)
