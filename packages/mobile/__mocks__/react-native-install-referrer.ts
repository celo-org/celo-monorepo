export default {
  getReferrer: jest.fn(async () => {
    return {
      clickTimestamp: '',
      installReferrer: '',
      installTimestamp: '',
    }
  }),
}
