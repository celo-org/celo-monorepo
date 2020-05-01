export enum colors {
  greenFaint = '#97DFC1', // green disabled
  greenBrand = '#42D689',
  greenUI = '#1AB775',
  goldFaint = '#E3C376', // gold disabled
  goldBrand = '#FBCC5C',
  goldUI = '#EEB93C',
  goldDark = '#9C6E00',
  beige = '#F5F4F0',
  brownFaint = '#FFF9EE',
  warning = '#EA6042',
  dark = '#2E3338',
  gray5 = '#81868B',
  gray4 = '#9CA4A9',
  gray3 = '#B4B9BD',
  gray2 = '#EDEEEF',
  gray1 = '#F8F9F9',
  light = '#FFFFFF',
}

// transition table old names new colors
export default {
  background: colors.light,
  gray: colors.gray5,
  dark: colors.dark,
  darkSecondary: colors.gray5,
  darkLightest: colors.gray1,
  white: colors.light,
  inactive: colors.gray4,
  listBorder: colors.gray2,
  inputBorder: colors.gray2,
  celoGold: colors.goldBrand,
  celoGoldInactive: colors.goldFaint,
  celoGreen: colors.greenBrand,
  celoDarkGreenInactive: colors.greenFaint,
  celoGreenInactive: colors.greenFaint,
  errorRed: colors.warning,
}
