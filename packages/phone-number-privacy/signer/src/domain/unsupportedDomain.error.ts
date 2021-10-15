export class UnsupportedDomainError extends Error {
  constructor() {
    super('Domain type is not supported')
  }
}
