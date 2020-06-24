// Designer Created Figma Colors
export enum Colors {
  greenFaint = '#97DFC1', // green disabled
  greenBrand = '#42D689',
  greenUI = '#1AB775',
  goldFaint = '#E3C376', // gold disabled
  goldBrand = '#FBCC5C',
  goldUI = '#EEB93C',
  goldDark = '#9C6E00',
  beige = '#F1F0EB',
  brownFaint = '#FFF9EE',
  warning = '#EA6042',
  dark = '#2E3338',
  gray5 = '#81868B',
  gray4 = '#9CA4A9',
  gray3 = '#B4B9BD',
  gray2 = '#EDEEEF',
  gray1 = '#F8F9F9',
  light = '#FFFFFF',
  purple = '#D39CFE',
  teal = '#7AD6FE',
  orange = '#FEB45E',
  onboardingGreen = '#1E845F',
  onboardingBrown = '#66541A',
  onboardingBrownLight = '#A49B80',
  onboardingAccent = '#0C689C',
  onboardingLightBlue = '#D6E7EF',
  onboardingSecondaryButton = '#EBEBE1',
  onboardingDark = '#EBEBE1',
  onboardingBackground = '#F9F5ED',
}

export default {
  ...Colors,
  get background() {
    return deprecationNotice('light')
  },
  get gray() {
    return deprecationNotice('gray5')
  },
  get darkSecondary() {
    return deprecationNotice('gray5')
  },
  get darkLightest() {
    return deprecationNotice('gray1')
  },
  get white() {
    return deprecationNotice('light')
  },
  get inactive() {
    return deprecationNotice('gray4')
  },
  get listBorder() {
    return deprecationNotice('gray2')
  },
  get inputBorder() {
    return deprecationNotice('gray2')
  },
  get celoGold() {
    return deprecationNotice('goldBrand')
  },
  get celoGoldInactive() {
    return deprecationNotice('goldFaint')
  },
  get celoGreen() {
    return deprecationNotice('greenBrand')
  },
  get celoDarkGreenInactive() {
    return deprecationNotice('greenFaint')
  },
  get celoGreenInactive() {
    return deprecationNotice('greenFaint')
  },
  get errorRed() {
    return deprecationNotice('warning')
  },
}

function deprecationNotice(color: string) {
  console.warn(`deprecated: trying colors.${color}`)
  // @ts-ignore
  return Colors[color]
}
