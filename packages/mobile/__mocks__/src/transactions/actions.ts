module.exports = {
  ...jest.requireActual('src/transactions/actions'),
  generateStandbyTransactionId: jest.fn(() => 'a sha3 hash'),
}
