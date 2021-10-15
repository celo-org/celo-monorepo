export class UnknownDomainError extends Error {
  constructor() {
    super('Unknown domain type')
  }
}
