import { TEXT } from './BlueBanner'
test('Announcement Text is less than 75 characters so that it fits on small phones', () => {
  expect(TEXT.length).toBeLessThanOrEqual(75)
})
