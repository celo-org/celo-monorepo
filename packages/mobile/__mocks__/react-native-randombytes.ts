export const randomBytes = jest.fn(() => ({
  toString: jest.fn(() => '123'),
}))

export default {}
