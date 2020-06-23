module.exports = {
  ...jest.requireActual('src/pincode/utils'),
  ensureCorrectPin: jest.fn(() => '123456'),
}
