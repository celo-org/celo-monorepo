jest.mock('./src/config', () => ({
  BLOCKSCOUT_API: '',
  STABLE_TOKEN_ADDRESS: '',
  GOLD_TOKEN_ADDRESS: '',
  ...jest.requireActual('./src/config'),
}))
