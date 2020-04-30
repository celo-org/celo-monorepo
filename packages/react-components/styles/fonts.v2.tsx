import colors from '@celo/react-components/styles/colors.v2'
import { StyleSheet } from 'react-native'

const Inter = {
  Regular: 'Inter-Regular',
  Medium: 'Inter-Medium',
  SemiBold: 'Inter-SemiBold',
}

export const fontFamily = Inter.Regular

const standards = {
  large: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
  regular: {
    fontSize: 15,
    lineHeight: 20,
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

export const fontStyles = StyleSheet.create({
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: Inter.Medium,
    color: colors.dark,
  },
  h2: {
    fontSize: 19,
    lineHeight: 26,
    fontFamily: Inter.SemiBold,
    color: colors.dark,
  },
  sectionHeader: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: Inter.Medium,
    color: colors.dark,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
  large: standards.large,
  regular: standards.regular,
  small: standards.small,
  large600: { ...standards.large, fontFamily: Inter.SemiBold },
  regular600: { ...standards.regular, fontFamily: Inter.SemiBold },
  small600: { ...standards.small, fontFamily: Inter.SemiBold },
  regular500: { ...standards.regular, fontFamily: Inter.Medium },

  // paragraph: {
  //   fontSize: 16,
  //   lineHeight: 20,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.dark,
  // },
  // body: {
  //   fontSize: 16,
  //   lineHeight: 24,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.dark,
  // },
  // bodyLarge: {
  //   fontSize: 17,
  //   lineHeight: 26,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.dark,
  // },
  // bodySecondary: {
  //   fontSize: 16,
  //   lineHeight: 24,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.darkSecondary,
  // },
  // bodySmall: {
  //   fontSize: 14,
  //   lineHeight: 18,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.dark,
  // },
  // bodySmallSecondary: {
  //   fontSize: 14,
  //   lineHeight: 18,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.darkSecondary,
  // },
  // bodySmallBold: {
  //   fontSize: 14,
  //   lineHeight: 18,
  //   fontFamily: HindSilguri.Bold,
  //   color: colors.dark,
  // },
  // bodyXSmall: {
  //   fontSize: 12,
  //   lineHeight: 16,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.dark,
  // },
  // bodyBold: {
  //   fontSize: 16,
  //   lineHeight: 24,
  //   fontFamily: HindSilguri.Bold,
  //   color: colors.dark,
  // },
  // bodySmallSemiBold: {
  //   fontSize: 14,
  //   lineHeight: 18,
  //   fontFamily: HindSilguri.SemiBold,
  //   color: colors.dark,
  // },
  // sectionLabel: {
  //   color: colors.darkSecondary,
  //   fontSize: 12,
  //   fontFamily: HindSilguri.Medium,
  // },
  // sectionLabelNew: {
  //   color: colors.dark,
  //   fontSize: 18,
  //   fontFamily: HindSilguri.SemiBold,
  // },
  // subSmall: {
  //   fontSize: 14,
  //   lineHeight: 20,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.darkSecondary,
  // },
  // activityCurrencyReceived: {
  //   fontSize: 15,
  //   lineHeight: 20,
  //   fontFamily: HindSilguri.SemiBold,
  //   color: colors.dark,
  // },
  // activityCurrencySent: {
  //   fontSize: 15,
  //   lineHeight: 20,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.darkSecondary,
  // },
  // pCurrency: {
  //   fontSize: 20,
  //   lineHeight: 32,
  //   fontFamily: HindSilguri.Regular,
  // },
  // iconText: {
  //   fontSize: 16,
  //   fontFamily: HindSilguri.Medium,
  //   color: colors.white,
  // },
  // telephoneHeadline: {
  //   fontSize: 14,
  //   fontFamily: HindSilguri.Light,
  //   color: colors.dark,
  //   textAlignVertical: 'center',
  // },
  // headerTitle: {
  //   fontSize: 14,
  //   fontFamily: HindSilguri.Bold,
  //   color: colors.dark,
  // },
  // headerButton: {
  //   fontSize: 14,
  //   fontFamily: HindSilguri.SemiBold,
  //   lineHeight: 22,
  //   color: colors.celoGreen,
  // },
  // notificationIcon: {
  //   color: colors.errorRed,
  //   fontSize: 16,
  //   fontFamily: HindSilguri.Bold,
  // },
  // buttonText: {
  //   fontFamily: HindSilguri.SemiBold,
  //   fontSize: 16,
  // },
  // messageText: {
  //   fontSize: 12,,
  // },
  // center: {
  //   textAlign: 'center',
  // },
  // light: {
  //   fontFamily: HindSilguri.Light,
  // },
  // regular: {
  //   fontFamily: HindSilguri.Regular,
  // },
  // medium: {
  //   fontFamily: HindSilguri.Medium,
  // },
  // semiBold: {
  //   fontFamily: HindSilguri.SemiBold,
  // },
  // bold: {
  //   fontFamily: HindSilguri.Bold,
  // },
  // comment: {
  //   fontSize: 15,
  //   fontFamily: HindSilguri.Regular,
  //   color: colors.darkSecondary,
  // },
  // notification: {
  //   fontFamily: HindSilguri.Bold,
  //   color: colors.white,
  //   fontSize: 10,
  //   lineHeight: 18,
  // },
})

export default fontStyles
