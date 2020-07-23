import colors from '@celo/react-components/styles/colors.v2'
import { StyleSheet } from 'react-native'

const Inter = {
  Regular: 'Inter-Regular',
  Medium: 'Inter-Medium',
  SemiBold: 'Inter-SemiBold',
}

const Jost = {
  Book: 'Jost-Book',
  Medium: 'Jost-Medium',
}

export const fontFamily = Inter.Regular

const standards = {
  large: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
  regular: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
  small: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
}
// Figma Font Styles
const fontStyles = StyleSheet.create({
  h1: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: Jost.Book,
    color: colors.dark,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: Jost.Medium,
    color: colors.dark,
  },
  sectionHeader: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: Inter.Medium,
    color: colors.dark,
  },
  navigationHeader: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: Jost.Medium,
    color: colors.dark,
  },
  notificationHeadline: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: Jost.Medium,
    color: colors.dark,
  },
  displayName: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Jost.Medium,
    color: colors.dark,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: Inter.SemiBold,
    color: colors.dark,
  },
  large: standards.large,
  regular: standards.regular,
  small: standards.small,
  large600: { ...standards.large, fontFamily: Inter.SemiBold },
  regular600: { ...standards.regular, fontFamily: Inter.SemiBold },
  small600: { ...standards.small, fontFamily: Inter.SemiBold },
  large500: { ...standards.large, fontFamily: Inter.Medium },
  regular500: { ...standards.regular, fontFamily: Inter.Medium },
  small500: { ...standards.small, fontFamily: Inter.Medium },
  center: {
    textAlign: 'center',
  },
  mediumNumber: {
    lineHeight: 27,
    fontSize: 24,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
  largeNumber: {
    lineHeight: 40,
    fontSize: 32,
    fontFamily: Inter.SemiBold,
    color: colors.dark,
  },
  iconText: {
    fontSize: 16,
    fontFamily: Inter.Medium,
    color: colors.white,
  },
  emptyState: {
    ...standards.large,
    color: colors.gray3,
    textAlign: 'center',
  },
})

export default fontStyles

// map of deprecated font names to new font styles.
export const oldFontsStyles = StyleSheet.create({
  body: fontStyles.regular,
  bodySmall: fontStyles.small,
  bodySmallBold: fontStyles.small600,
  bodyBold: fontStyles.regular600,
  bodySmallSemiBold: fontStyles.small600,
  sectionLabel: fontStyles.sectionHeader,
  sectionLabelNew: fontStyles.sectionHeader,
  headerTitle: fontStyles.regular600,
})
