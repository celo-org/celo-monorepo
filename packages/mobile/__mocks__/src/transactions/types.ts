module.exports = {
  ...jest.requireActual('src/transactions/types'),
  newTransactionContext: jest.fn(() => ({ id: 'a uuid' })),
}
