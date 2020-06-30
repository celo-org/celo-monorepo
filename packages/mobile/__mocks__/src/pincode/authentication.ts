module.exports = {
  ...jest.requireActual('src/pincode/authentication'),
  ensureCorrectPassword: jest.fn(() => true),
  checkPin: jest.fn().mockResolvedValue(true),
}
