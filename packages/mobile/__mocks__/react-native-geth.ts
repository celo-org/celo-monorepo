// @ts-ignore
export default jest.fn().mockImplementation(() => {
  return {
    setConfig: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    subscribeNewHead: jest.fn(),
  }
})
