import colors from '@celo/react-components/styles/colors'
import { StyleSheet } from 'react-native'

const HindSilguri = {
  Light: 'Hind-Light',
  Regular: 'Hind-Regular',
  Medium: 'Hind-Medium',
  SemiBold: 'Hind-SemiBold',
  Bold: 'Hind-Bold',
}

// const HindByWeight = {
//   w200: HindSilguri.Light,
//   w400: HindSilguri.Regular,
//   w500: HindSilguri.Medium,
//   w600: HindSilguri.SemiBold,
//   w700: HindSilguri.Bold,
// }

const HIND_SILIGURI_WIDTH_TO_HEIGHT = 0.45

export const estimateFontSize = (
  defaultFontSize: number,
  stringLength: number,
  containerWidth: number
) => {
  let fontSize = defaultFontSize
  let charWidth = fontSize * HIND_SILIGURI_WIDTH_TO_HEIGHT
  let overflow = containerWidth - stringLength * charWidth
  while (overflow < 0) {
    fontSize -= 1
    charWidth = fontSize * HIND_SILIGURI_WIDTH_TO_HEIGHT
    overflow = containerWidth - stringLength * charWidth
  }
  return fontSize
}

export const fontFamily = HindSilguri.Regular

// WARNING DO NOT CHANGE WITHOUT TAYLOR/DESIGNLEAD
export const fontStyles = StyleSheet.create({
  h1: {
    fontSize: 22,
    fontFamily: HindSilguri.Light,
    paddingBottom: 20,
    textAlign: 'center',
  },
  h2: {
    fontSize: 18,
    fontFamily: HindSilguri.Light,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: HindSilguri.Regular,
    color: colors.dark,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: HindSilguri.Regular,
    color: colors.dark,
  },
  bodySecondary: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: HindSilguri.Regular,
    color: colors.darkSecondary,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: HindSilguri.Regular,
    color: colors.dark,
  },
  bodySmallBold: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: HindSilguri.Bold,
    color: colors.dark,
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: HindSilguri.Bold,
    color: colors.dark,
  },
  bodySmallSemiBold: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: HindSilguri.SemiBold,
    color: colors.dark,
  },
  linkSmall: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: HindSilguri.SemiBold,
    color: colors.darkSecondary,
  },
  sectionLabel: {
    color: colors.darkSecondary,
    fontSize: 12,
    fontFamily: HindSilguri.Medium,
  },
  subSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: HindSilguri.Regular,
    color: colors.darkSecondary,
  },
  currency: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: HindSilguri.Regular,
    letterSpacing: -0.75,
    color: colors.darkSecondary,
  },
  activityCurrency: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: HindSilguri.Regular,
    color: colors.darkSecondary,
  },
  pCurrency: {
    fontSize: 20,
    lineHeight: 32,
    fontFamily: HindSilguri.Regular,
  },
  iconText: {
    fontSize: 16,
    fontFamily: HindSilguri.Medium,
    color: colors.white,
  },
  telephoneHeadline: {
    fontSize: 14,
    fontFamily: HindSilguri.Light,
    color: colors.dark,
    textAlignVertical: 'center',
  },
  link: {
    color: colors.celoGreen,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: HindSilguri.Medium,
  },
  linkInline: {
    color: colors.celoGreen,
    fontFamily: HindSilguri.SemiBold,
  },
  bodyLink: {
    color: colors.celoDarkGreen,
    fontFamily: HindSilguri.Medium,
    fontSize: 16,
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: HindSilguri.Medium,
    color: colors.dark,
  },
  headerButton: {
    fontSize: 14,
    fontFamily: HindSilguri.SemiBold,
    lineHeight: 22,
    color: colors.celoGreen,
  },
  notificationIcon: {
    color: colors.errorRed,
    fontSize: 16,
    fontFamily: HindSilguri.Bold,
  },
  buttonText: {
    fontFamily: HindSilguri.SemiBold,
    fontSize: 16,
  },
  messageText: {
    fontSize: 12,
    color: colors.messageBlue,
  },
  center: {
    textAlign: 'center',
  },
  light: {
    fontFamily: HindSilguri.Light,
  },
  regular: {
    fontFamily: HindSilguri.Regular,
  },
  medium: {
    fontFamily: HindSilguri.Medium,
  },
  semiBold: {
    fontFamily: HindSilguri.SemiBold,
  },
  bold: {
    fontFamily: HindSilguri.Bold,
  },
  comment: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: HindSilguri.Light,
    color: colors.darkSecondary,
  },
  notification: {
    fontFamily: HindSilguri.Bold,
    color: colors.white,
    fontSize: 10,
    lineHeight: 18,
  },
})

export default fontStyles
