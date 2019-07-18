export function randomIntegerInRange(min: number, max: number) {
  return Math.round(Math.random() * (max - min + 1)) + min
}

export function scrollTo(elementID: string, position?: 'start' | 'center') {
  const element = document.getElementById(elementID)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: position,
      inline: position,
    })
  }
}
