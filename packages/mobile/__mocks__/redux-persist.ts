module.exports = {
  ...jest.requireActual('redux-persist'),
  persistReducer: jest.fn().mockImplementation((config, reducers) => reducers),
}
