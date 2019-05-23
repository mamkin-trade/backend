export function fee(isMarket: boolean) {
  return isMarket ? 0.002 : 0.001
}

export function feeMultiplier(isMarket: boolean) {
  return isMarket ? 0.998 : 0.999
}
