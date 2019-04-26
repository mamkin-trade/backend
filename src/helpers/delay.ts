export function delay(seconds: number) {
  return new Promise(res => {
    setTimeout(() => {
      res()
    }, seconds * 1000)
  })
}
