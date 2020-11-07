import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Transceive from 'src/dev/Transceive'
import { H2, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Fade from 'src/shared/AwesomeFade'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles } from 'src/styles'

const DELAY = 100
const DURATION = 400

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
    paddingHorizontal: 20,
    height: '33vh',
    minHeight: 250,
    maxHeight: 400,
    marginTop: HEADER_HEIGHT,
  },
  gap: {
    width: 20,
  },
  baking: { height: 151, width: 169 },
  button: {
    marginHorizontal: 10,
  },
  colorEmphasis: {
    color: colors.gold,
  },
})

export default withNamespaces('dev')(CoverComponent)
