module.exports = {
  ...jest.requireActual('src/pincode/authentication'),
  ensureCorrectPassword: jest.fn(() => true),
  checkPin: jest.fn().mockResolvedValue(true),
  getPassword: jest.fn(
    async () => '0000000000000000000000000000000000000000000000000000000000000001' + '111555'
  ),
  getPasswordSaga: jest.fn(function*() {
    return '0000000000000000000000000000000000000000000000000000000000000001' + '111555'
  }),
}
