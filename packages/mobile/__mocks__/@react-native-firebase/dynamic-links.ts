const getInitialLink = jest.fn()
const buildShortLink = jest.fn()

export default function links() {
  return {
    getInitialLink,
    buildShortLink,
  }
}
