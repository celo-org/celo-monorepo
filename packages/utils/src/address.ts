export type Address = string

export function eqAddress(a: Address, b: Address) {
  return a.replace('0x', '').toLowerCase() === b.replace('0x', '').toLowerCase()
}
