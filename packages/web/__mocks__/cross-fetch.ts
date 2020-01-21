export default function FetchMock() {
  return Promise.resolve({
    json: () => [],
  })
}
