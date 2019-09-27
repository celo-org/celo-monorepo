jest.mock('./src/config', () => ({
  ...jest.requireActual('./src/config'),
  BLOCKSCOUT_API: '',
  NOTIFICATIONS_DISABLED: true,
}))
