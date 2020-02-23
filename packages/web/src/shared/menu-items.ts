import DevelopersPage from 'pages/developers'

export const menuItems = {
  HOME: {
    name: 'Home',
    link: '/',
  },
  APPLICATIONS: {
    name: 'Applications',
    link: '/applications',
  },
  ABOUT_US: {
    name: 'About',
    link: '/about',
  },
  BUILD: {
    name: 'Validators',
    link: '/validators',
  },
  VALIDATORS_LIST: {
    name: 'Validators List',
    link: '/validators/explore',
  },
  BRAND: {
    name: 'Experience - Brand Kit',
    link: '/experience/brand',
  },
  COMMUNITY: {
    name: 'Community',
    link: '/community',
  },
  DEVELOPERS: {
    name: 'Developers',
    link: '/developers',
  },
  SDK_DEVELOPERS: {
    name: DevelopersPage,
    link: '/developers',
  },
  JOBS: {
    name: 'Join',
    link: '/jobs',
  },
  MEDIUM: {
    name: 'Medium',
    link: 'https://medium.com/@celo.org',
  },
  PRIVACY: {
    name: 'Privacy Policy',
    link: '/privacy',
  },

  TECH: {
    name: 'Technology',
    link: '/technology',
  },
  TERMS: {
    name: 'Terms',
    link: '/terms',
  },
  TWITTER: {
    name: 'Twitter',
    link: 'https://twitter.com/CeloHQ',
  },
  CODE_OF_CONDUCT: {
    name: 'Code of Conduct',
    link: '/code-of-conduct',
  },
}

// TODO: Temporary link to the master branch documentation for 'sdkDocs' and 'sdkTutorial'
export enum CeloLinks {
  agreement = '/user-agreement',
  faq = '/faq',
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
  gitHub = 'https://github.com/celo-org',
  fundingRequest = 'https://c-labs.typeform.com/to/gj9aUp',
  linkedIn = 'https://www.linkedin.com/company/celohq/',
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
  home: { partnerships: 'partnerships' },
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

export default menuItems
