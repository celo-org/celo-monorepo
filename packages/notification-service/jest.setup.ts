jest.mock('./src/config', () => ({
  ...jest.requireActual('./src/config'),
  NOTIFICATIONS_DISABLED: true,
}))
