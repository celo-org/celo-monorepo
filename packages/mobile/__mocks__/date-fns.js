export function format(date, template) {
  // -> "2018-02-01T00:00:00.000Z @{M/D/YYYY h:mma}"
  return `${date} @{${template}}`
}
