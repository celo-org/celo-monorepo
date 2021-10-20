export type Address = string
export type BytesAsString = string

export enum ProxyTypes {
  eip1967 = 'eip1967',
  unstructured = 'unstructured',
  beacon = 'beacon',
}

export interface KnownProxy {
  bytecode: string
  location: Address
}
