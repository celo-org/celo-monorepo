import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import CeloRoles from 'src/community/connect/CeloRoles'
import { H1, H4 } from 'src/fonts/Fonts'
import EmailForm from 'src/forms/EmailForm'
import { NameSpaces, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { useScreenSize } from 'src/layout/ScreenSize'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles } from 'src/styles'

export default React.memo(function CoverArea() {
  const { t } = useTranslation(NameSpaces.community)
  return (
    <GridRow
      allStyle={[standardStyles.centered, styles.fullScreen]}
      desktopStyle={styles.root}
      tabletStyle={styles.root}
      mobileStyle={styles.mobileRoot}
    >
      <Cell span={Spans.full} style={styles.content}>
        <CeloRoles />
        <FourWords />
        <View
          style={[
            standardStyles.centered,
            styles.ctaArea,
            // isMobile ? standardStyles.elementalMarginTop : standardStyles.blockMarginTop,
            styles.fadeIn,
          ]}
        >
          <H4 style={[textStyles.center, standardStyles.elementalMargin]}>
            {t('cover.joinMovement')}
          </H4>
          <EmailForm submitText={t('common:signUp')} route={'/contacts'} isDarkMode={false} />
        </View>
      </Cell>
    </GridRow>
  )
})

const FourWords = React.memo(function _FourWords() {
  const { isTablet } = useScreenSize()
  return (
    <View style={[standardStyles.centered, isTablet && standardStyles.elementalMargin]}>
      <H1 style={textStyles.center}>
        <Text style={[styles.fadeIn, styles.developers]}>Developers. </Text>
        <Text style={[styles.fadeIn, styles.designers]}>Designers. </Text>
        <Text style={[styles.fadeIn, styles.dreamers]}>Dreamers. </Text>
        <Text style={[styles.fadeIn, styles.doers]}>Doers. </Text>
      </H1>
    </View>
  )
})

const styles = StyleSheet.create({
  fullScreen: {
    width: '100vw',
    minHeight: `100vh`,
  },
  mobileRoot: {
    paddingTop: HEADER_HEIGHT,
  },
  root: { flexDirection: 'column' },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexGrow: 1,
    flexBasis: '100%',
    height: '100%',
    marginTop: 15,
  },
  developers: {
    color: colors.primaryPress,
    animationDelay: '1500ms',
  },
  designers: {
    color: colors.purpleScreen,
    animationDelay: '3400ms',
  },
  dreamers: {
    color: colors.redScreen,
    animationDelay: '4900ms',
  },
  doers: {
    color: colors.blueScreen,
    animationDelay: '6400ms',
  },
  ctaArea: {
    animationDelay: '7500ms',
    maxWidth: 550,
    width: '100%',
  },
  fadeIn: {
    animationDuration: `500ms`,
    animationFillMode: 'both',
    animationIterationCount: 1,
    animationKeyframes: [
      {
        '0%': {
          opacity: 0,
        },

        '100%': {
          opacity: 1,
        },
      },
    ],
  },
})
