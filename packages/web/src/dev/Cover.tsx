import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import LeaderBoard from 'src/dev/LeaderBoard'
import stakeOffLeaders from 'src/dev/tgsco-final.json'
import Transceive from 'src/dev/Transceive'
import { H2, H3, H4 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import { CeloLinks } from 'src/shared/menu-items'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

const DELAY = 100
const DURATION = 400

function Link({ children, href }) {
  return <Button style={textStyles.invert} kind={BTN.INLINE} text={children} href={href} />
}

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
        <TitleAndSubTitle title={t('greatStakeOff')} subtitle={''}>
          <Fade delay={DELAY} duration={DURATION}>
            <Image
              style={styles.baking}
              source={require('src/dev/bakeoff.png')}
              resizeMode={'contain'}
            />
          </Fade>
        </TitleAndSubTitle>
      </GridRow>

      <GridRow
        mobileStyle={standardStyles.blockMarginBottomMobile}
        tabletStyle={standardStyles.blockMarginBottomTablet}
        desktopStyle={standardStyles.blockMarginBottom}
      >
        <Cell span={Spans.fourth}>
          <H3 style={textStyles.invert}>{t('purposeTitle')}</H3>
        </Cell>
        <Cell span={Spans.half}>
          <H4 style={[textStyles.invert, standardStyles.elementalMarginBottom]}>
            <Trans ns={NameSpaces.dev} i18nKey={'purposeText'}>
              <Text href={CeloLinks.discourse} style={styles.colorEmphasis}>
                2 million Celo Gold in rewards.
              </Text>
              *
            </Trans>
          </H4>
          <Text style={[fonts.p, textStyles.invert]}>
            <Trans ns={NameSpaces.dev} i18nKey={'purposeAsterisk'}>
              <Link href={CeloLinks.stakeOffTerms}>Terms and Conditions</Link>
            </Trans>
          </Text>
        </Cell>
      </GridRow>
      <GridRow
        mobileStyle={standardStyles.blockMarginBottomMobile}
        tabletStyle={standardStyles.blockMarginBottomTablet}
        desktopStyle={standardStyles.blockMarginBottom}
      >
        <Cell span={Spans.fourth}>
          <H3 style={textStyles.invert}>{t('challengeTitle')}</H3>
        </Cell>
        <Cell span={Spans.half}>
          <Text style={[fonts.p, textStyles.invert, standardStyles.elementalMarginBottom]}>
            {t('challengeText')}
          </Text>
        </Cell>
      </GridRow>
      <GridRow
        mobileStyle={standardStyles.blockMarginBottomMobile}
        tabletStyle={standardStyles.blockMarginBottomTablet}
        desktopStyle={standardStyles.blockMarginBottom}
      >
        <Cell span={Spans.fourth}>
          <H3 style={textStyles.invert}>{t('whoTitle')}</H3>
        </Cell>
        <Cell span={Spans.half}>
          <Text style={[fonts.p, textStyles.invert]}>{t('whoText')}</Text>
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.blockMarginBottom}
        tabletStyle={standardStyles.blockMarginBottomTablet}
        mobileStyle={standardStyles.blockMarginBottomMobile}
      >
        <Cell span={Spans.full}>
          <LeaderBoard isLoading={false} leaders={stakeOffLeaders} />
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
