import * as React from 'react'
import LazyLoad from 'react-lazyload'
import { StyleSheet, View } from 'react-native'
import { H3, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Fade from 'src/shared/AwesomeFade'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { hashNav } from 'src/shared/menu-items'
import { G, Path } from 'src/shared/svg'
import { colors, standardStyles, textStyles } from 'src/styles'
import Svg from 'svgs'

type Props = I18nProps & ScreenProps

const CodeofConduct: React.FunctionComponent<Props> = function CodeOfConduct({ t, screen }) {
  return (
    <View nativeID={hashNav.connect.code} style={styles.darkBackground}>
      <GridRow
        allStyle={standardStyles.centered}
        desktopStyle={standardStyles.sectionMargin}
        tabletStyle={standardStyles.sectionMarginTablet}
        mobileStyle={standardStyles.sectionMarginMobile}
      >
        <Cell span={Spans.half}>
          <View
            style={
              ScreenSizes.MOBILE === screen ? styles.animationAreaMobile : styles.animationArea
            }
          >
            <LazyLoad once={true}>
              <IntegratingAnimation darkMode={true} />
            </LazyLoad>
          </View>
        </Cell>
        <Cell span={Spans.half}>
          <Fade distance={'20px'} delay={400} duration={3300}>
            <View>
              <H3 style={textStyles.invert}>{t('codeOfConduct.title')}</H3>
              <H4 style={[textStyles.invert, standardStyles.blockMarginTablet]}>
                {t('codeOfConduct.text')}
              </H4>
              <Button
                text={t('codeOfConduct.button')}
                kind={BTN.PRIMARY}
                href={'/code-of-conduct'}
                size={SIZE.big}
                target={'_tab'}
              />
            </View>
          </Fade>
        </Cell>
      </GridRow>
    </View>
  )
}

export function IntegratingAnimation({ darkMode }: { darkMode: boolean }) {
  const blendStyle = { mixBlendMode: darkMode ? 'screen' : 'multiply' }
  const opacity = 0.95
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 353 132"
      fill="none"
      style={{ overflow: 'visible' }}
    >
      <G style={[styles.animationBase, styles.coinOne, blendStyle]}>
        <Path
          d="M73.8575 0C46.0188 0 16.1671 26.4774 4.42227 61.5833C-2.38131 81.9649 -1.29403 101.48 7.40422 115.119C13.4219 124.647 22.8737 130.468 34.0157 131.51C35.0922 131.62 36.2225 131.674 37.6005 131.674C50.3249 131.674 64.3196 125.436 77.0117 114.122C89.7361 102.818 100.243 87.2056 106.594 70.146C114.324 49.282 113.409 29.4267 104.086 15.6781C97.2394 5.56958 86.5066 0 73.8575 0Z"
          fill={darkMode ? colors.blueScreen : colors.lightBlue}
          opacity={opacity}
        />
      </G>
      <G style={[styles.animationBase, styles.coinTwo, blendStyle]}>
        <Path
          d="M153.858 0C126.019 0 96.1671 26.4774 84.4223 61.5833C77.6187 81.9649 78.706 101.48 87.4042 115.119C93.4219 124.647 102.874 130.468 114.016 131.51C115.092 131.62 116.223 131.674 117.6 131.674C130.325 131.674 144.32 125.436 157.012 114.122C169.736 102.818 180.243 87.2056 186.594 70.146C194.324 49.282 193.409 29.4267 184.086 15.6781C177.239 5.56958 166.507 0 153.858 0Z"
          fill={darkMode ? colors.redScreen : colors.red}
          opacity={opacity}
        />
      </G>
      <G style={[styles.animationBase, styles.coinThree, blendStyle]}>
        <Path
          d="M234.858 0C207.019 0 177.167 26.4774 165.422 61.5833C158.619 81.9649 159.706 101.48 168.404 115.119C174.422 124.647 183.874 130.468 195.016 131.51C196.092 131.62 197.223 131.674 198.6 131.674C211.325 131.674 225.32 125.436 238.012 114.122C250.736 102.818 261.243 87.2056 267.594 70.146C275.324 49.282 274.409 29.4267 265.086 15.6781C258.239 5.56958 247.507 0 234.858 0Z"
          fill={darkMode ? colors.purpleScreen : colors.purple}
          opacity={opacity}
        />
      </G>
      <G style={[styles.animationBase, styles.coinFour, blendStyle]}>
        <Path
          d="M314.858 0C287.019 0 257.167 26.4774 245.422 61.5833C238.619 81.9649 239.706 101.48 248.404 115.119C254.422 124.647 263.874 130.468 275.016 131.51C276.092 131.62 277.223 131.674 278.6 131.674C291.325 131.674 305.32 125.436 318.012 114.122C330.736 102.818 341.243 87.2056 347.594 70.146C355.324 49.282 354.409 29.4267 345.086 15.6781C338.239 5.56958 327.507 0 314.858 0Z"
          fill={darkMode ? colors.greenScreen : colors.primary}
          opacity={opacity}
        />
      </G>
    </Svg>
  )
}
const DURATION = 2500

const STAGGER = 500

const DELAY = 1000

const Y_LARGE = 80
const Y_SMALL = 60
const X_LARGE = 30
const X_SMALL = 20

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: colors.dark,
  },
  animationArea: {
    height: 500,
    width: '85%',
    justifyContent: 'center',
  },
  animationAreaMobile: {
    height: 230,
    width: '90%',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  animationBase: {
    animationIterationCount: 1,
    animationTimingFunction: 'ease-in-out',
    animationFillMode: 'both',
  },
  coinOne: buildCoinStyles({ offset: STAGGER * 0.9, x: -X_LARGE, y: -Y_LARGE }),
  coinTwo: buildCoinStyles({ offset: 0, x: X_SMALL, y: Y_SMALL }),
  coinThree: buildCoinStyles({ offset: -STAGGER, x: -X_SMALL, y: -Y_SMALL }),
  coinFour: buildCoinStyles({ offset: STAGGER, x: X_LARGE, y: Y_LARGE }),
})

interface Coord {
  x: number
  y: number
}

function buildCoinStyles({ offset, x, y }) {
  return {
    animationDelay: `${DELAY + offset}ms`,
    animationDuration: `${DURATION - offset}ms`,
    animationKeyframes: keyFrames({ x, y }),
  }
}

function keyFrames(from: Coord) {
  return [
    {
      from: {
        opacity: 0.3,
        transform: [{ translateY: from.y }, { translateX: from.x }],
      },
      to: {
        opacity: 0.99,
        transform: [{ translateY: 0 }, { translateX: 0 }],
      },
    },
  ]
}

export default withNamespaces('community')(withScreenSize(CodeofConduct))
