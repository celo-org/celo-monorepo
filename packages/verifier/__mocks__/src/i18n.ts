export default { language: 'EN', t: (key: string) => key }
export const createScopedT = jest.fn(() => jest.fn())

export enum Namespaces {}
