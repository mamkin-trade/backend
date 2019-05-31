export function checkNasdaqTime() {
  return true
}

function calcTime() {
  const utcDate = new Date()
  const utcMs = utcDate.getTimezoneOffset() * 60000 + utcDate.getTime()
  return new Date(3600000 * -4 + utcMs)
}

console.log(calcTime())
