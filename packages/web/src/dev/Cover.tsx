import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import LeaderBoard from 'src/dev/LeaderBoard'
import Transceive from 'src/dev/Transceive'
import { H2, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles } from 'src/styles'
const DELAY = 100
const DURATION = 400

const LEADERS = [
  { points: 83, identity: 'Rex' },
  { points: 840, identity: '100%_that_validator_who_is_an_absolute_diva' },
  { points: 321, identity: 'Heisenberg' },

  { points: 764, identity: 'DX-West' },
  { points: 500, identity: 'Simone2148' },
  { points: 497, identity: '$celo-$' },
  { points: 1020, identity: '77zepher' },
  { points: 940, identity: 'Gatsby & Durben' },
]

const CoverComponent = React.memo(function Cover({ t }: I18nProps) {
  return (
    <View style={styles.cover}>
      <View style={[styles.phone, standardStyles.centered]}>
        <Transceive />
      </View>
      <GridRow
        allStyle={standardStyles.centered}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
      >
        <TitleAndSubTitle title={t('makeWithCelo')} subtitle={t('makeWithCeloSubtitle')} />
      </GridRow>
      <GridRow allStyle={standardStyles.centered}>
        <TitleAndSubTitle title={t('greatStakeOff')} subtitle={t('greatStakeOffSubtitle')}>
          <Fade delay={DELAY} duration={DURATION}>
            <Image
              style={{ height: 151, width: 169 }}
              source={require('src/dev/bakeoff.png')}
              resizeMode={'contain'}
            />
          </Fade>
        </TitleAndSubTitle>
      </GridRow>
      <GridRow>
        <Cell span={Spans.full}>
          <LeaderBoard leaders={LEADERS} />
        </Cell>
      </GridRow>
      <GridRow>
        <Cell span={Spans.full}>
          <H4 style={[textStyles.center, textStyles.invert, standardStyles.elementalMarginBottom]}>
            {t('')}
          </H4>
        </Cell>
      </GridRow>
    </View>
  )
})

interface TitleProps {
  title: string
  subtitle: string
  children?: React.ReactNode
}

const TitleAndSubTitle = React.memo(function _TitleAndSubtile({
  title,
  subtitle,
  children,
}: TitleProps) {
  return (
    <Cell span={Spans.half} style={[standardStyles.centered]}>
      {children}
      <H2
        style={[
          textStyles.center,
          textStyles.invert,
          standardStyles.blockMarginTopTablet,
          standardStyles.elementalMarginBottom,
        ]}
      >
        <Fade delay={DELAY} duration={DURATION}>
          {title}
        </Fade>
      </H2>

      <H4 style={[textStyles.center, textStyles.invert, standardStyles.elementalMarginBottom]}>
        <Fade delay={DELAY} duration={DURATION}>
          {subtitle}
        </Fade>
      </H4>
    </Cell>
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
