export function checkNasdaqTime() {
  const nyTime = getNewYorkTime()
  const weekDay = nyTime.getDay()
  if (weekDay === 0 || weekDay === 6) {
    return false
  }
  const hour = nyTime.getHours()
  if (hour >= 10 && hour < 16) {
    return true
  }
  const minute = nyTime.getMinutes()
  if (hour === 9 && minute >= 30) {
    return true
  }
  return false
}

function getNewYorkTime() {
  const utcDate = new Date()
  const utcMs = utcDate.getTimezoneOffset() * 60000 + utcDate.getTime()
  return new Date(3600000 * -4 + utcMs)
}
