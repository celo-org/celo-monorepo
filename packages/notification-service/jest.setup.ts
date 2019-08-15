jest.mock('./src/config', () => ({
  ...jest.requireActual('./src/config'),
  BLOCKSCOUT_API: '',
  STABLE_TOKEN_ADDRESS: '',
  GOLD_TOKEN_ADDRESS: '',
  NOTIFICATIONS_DISABLED: true,
}))
