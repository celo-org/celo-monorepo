export const pagePaths = {
  HOME: {
    name: 'Home',
    link: '/',
  },
  ABOUT_US: {
    name: 'About',
    link: '/about',
  },
  ALLIANCE_COLLECTIVE: {
    name: 'Alliance',
    link: '/alliance',
  },
  APPLICATIONS: {
    name: 'Applications',
    link: '/applications',
  },
  BRAND: {
    name: 'BrandKit',
    link: '/experience/brand',
  },
  BUILD: {
    name: 'Validators',
    link: '/validators',
  },
  CODE_OF_CONDUCT: {
    name: 'Code of Conduct',
    link: '/code-of-conduct',
  },
  COMMUNITY: {
    name: 'Community',
    link: '/community',
  },
  DEVELOPERS: {
    name: 'Developers',
    link: '/developers',
  },
  FAQ: {
    name: 'FAQ',
    link: '/faq',
  },
  FAUCET: {
    name: 'Faucet',
    link: '/developers/faucet',
  },
  JOBS: {
    name: 'Join',
    link: '/jobs',
  },
  PRIVACY: {
    name: 'Privacy Policy',
    link: '/privacy',
  },
  PAPERS: {
    name: 'White Papers',
    link: '/papers',
  },
  TECH: {
    name: 'Technology',
    link: '/technology',
  },
  TERMS: {
    name: 'Terms',
    link: '/terms',
  },
  VALIDATORS_LIST: {
    name: 'Validators List',
    link: '/validators/explore',
  },
  VALIDATORS_LIST__BAKLAVA: {
    name: 'Validators List - Baklava',
    link: '/validators/explore/baklava',
  },
  VALIDATORS_LIST_BAKLAVASTAGING: {
    name: 'Validators List - Baklavastaging',
    link: '/validators/explore/baklavastaging',
  },
}

export const MAIN_MENU = [
  pagePaths.ABOUT_US,
  pagePaths.JOBS,
  pagePaths.BUILD,
  pagePaths.DEVELOPERS,
  pagePaths.ALLIANCE_COLLECTIVE,
  pagePaths.COMMUNITY,
]

// TODO: Temporary link to the master branch documentation for 'sdkDocs' and 'sdkTutorial'
export enum CeloLinks {
  audits = '/audits',
  agreement = '/user-agreement',
  faucet = '/developers/faucet',
  iconsLicense = 'https://creativecommons.org/licenses/by-nd/4.0/legalcode',
  discord = 'https://discord.gg/6yWMkgM',
  discourse = 'https://forum.celo.org/',
  walletApp = '/developers/wallet',
  blockscout = 'http://alfajores-blockscout.celo-testnet.org/',
  disclaimer = 'https://docs.celo.org/important-information/alfajores-testnet-disclaimer',
  docs = 'https://docs.celo.org/',
  docsOverview = 'https://docs.celo.org/overview',
  sdkDocs = 'https://docs.celo.org/v/master/developer-guide/overview/introduction',
  sdkTutorial = 'https://docs.celo.org/v/master/developer-guide/start',
  nodeDocs = 'https://docs.celo.org/getting-started/running-a-full-node',
  gettingStarted = 'https://docs.celo.org/getting-started/alfajores-testnet',
  coinlist = 'https://coinlist.co/celo?utm_source=celo%20website&utm_medium=website%20widget&utm_campaign=celowebsite_20200318',
  gitHub = 'https://github.com/celo-org',
  instagram = 'https://www.instagram.com/celoorg/',
  twitter = 'https://twitter.com/CeloOrg',
  medium = 'https://medium.com/celoOrg',
  mediumUser = 'https://medium.com/@celoorg',
  mediumPublication = 'https://medium.com/celoOrg',
  fundingRequest = 'https://c-labs.typeform.com/to/gj9aUp',
  linkedIn = 'https://www.linkedin.com/company/celoOrg/',
  monorepo = 'https://github.com/celo-org/celo-monorepo',
  blockChainRepo = 'https://github.com/celo-org/celo-blockchain',
  playStoreWallet = 'https://play.google.com/store/apps/details?id=org.celo.mobile.alfajores',
  appStoreWallet = 'https://apps.apple.com/us/app/celo-alfajores-wallet/id1482389446',
  privacyDocs = 'https://docs.celo.org/celo-codebase/protocol/privacy',
  tutorial = 'https://docs.celo.org/getting-started/faucet#creating-an-empty-account-with-the-celo-client',
  buildWalletDocs = 'https://docs.celo.org/celo-codebase/wallet/intro',
  stakeOffTerms = '/stake-off/terms',
  youtube = 'https://youtube.com/channel/UCCZgos_YAJSXm5QX5D5Wkcw',
}

export const languageOptions = {
  EN: {
    label: 'EN',
    language: 'EN',
  },
  ES: {
    label: 'ES',
    language: 'ES',
  },
}

export const hashNav = {
  about: { backers: 'backers' },
  build: {
    features: 'features',
    stack: 'stack',
    newsletter: 'newsletter',
    applications: 'applications',
    contracts: 'contracts',
    blockchain: 'blockchain',
    leaderboard: 'leaderboard',
  },
  connect: {
    tenets: 'tenets',
    code: 'code',
    events: 'events',
    blog: 'blog',
    fellowship: 'fellowship',
    fund: 'fund',
    newsletter: 'newsletter',
  },
  join: { roles: 'roles' },
  home: { partnerships: 'partnerships', timeline: 'timeline' },
  brandIntro: { overview: 'overview', brandVoice: 'brand-voice' },
  brandLogo: { overview: 'overview', space: 'space-and-sizing', backgrounds: 'backgrounds' },
  brandColor: { overview: 'overview', backgrounds: 'background-colors' },
  brandComposition: {
    overview: 'overview',
    grid: 'grid',
  },
  brandImagery: {
    overview: 'overview',
    illustrations: 'illustrations',
    graphics: 'abstract-graphics',
  },
  brandIcons: {
    overview: 'overview',
  },
  brandTypography: { overview: 'overview', scale: 'type-scale' },
}

export default pagePaths
