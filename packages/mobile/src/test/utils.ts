// Sleep for a number of ms
export const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(() => resolve(true), time))
