export default {
  getPackageName: () => 'org.celo.mobile.alfajores',
  getPlayStoreUrl: () => 'https://play.google.com/store/apps/details?id=org.celo.mobile.alfajores',
  getAppStoreUrl: jest.fn(
    (params: any) => 'https://apps.apple.com/us/app/celo-alfajores-wallet/id1482389446'
  ),
}
