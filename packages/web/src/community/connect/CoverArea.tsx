import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import CeloRoles from 'src/community/connect/CeloRoles'
import { H4 } from 'src/fonts/Fonts'
import EmailForm from 'src/forms/EmailForm'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, withScreenSize } from 'src/layout/ScreenSize'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

type Props = ScreenProps & I18nProps
class CoverArea extends React.PureComponent<Props> {
  render() {
    const { t } = this.props
    return (
      <GridRow
        allStyle={standardStyles.centered}
        desktopStyle={[standardStyles.sectionMarginBottom, styles.fullScreen]}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Cell span={Spans.full} style={standardStyles.centered}>
          <CeloRoles />
          <FourWords />
          <View
            style={[
              standardStyles.centered,
              styles.ctaArea,
              standardStyles.blockMarginTop,
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
  }
}

function FourWords() {
  return (
    <View style={standardStyles.centered}>
      <Text style={[fonts.specialOneOff, textStyles.center]}>
        <Text style={[styles.fadeIn, styles.developers]}>Developers. </Text>
        <Text style={[styles.fadeIn, styles.designers]}>Designers. </Text>
        <Text style={[styles.fadeIn, styles.dreamers]}>Dreamers. </Text>
        <Text style={[styles.fadeIn, styles.doers]}>Doers. </Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fullScreen: {
    width: '100vw',
    height: '100vh',
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
    animationDelay: '5200ms',
  },
  doers: {
    color: colors.blueScreen,
    animationDelay: '6400ms',
  },
  ctaArea: {
    animationDelay: '8s',
    paddingHorizontal: 65,
    marginBottom: 50,
    maxWidth: 600,
    width: '100%',
  },
  fadeIn: {
    marginHorizontal: 20,
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

export default withNamespaces(NameSpaces.community)(withScreenSize(CoverArea))
