function count(target, n) {
  if (n < target) {
    return 0
  }

  const d = Math.floor(Math.log10(n))
  const maxCounts = Array(d + 1).fill(0)

  if (maxCounts.length > 1) {
    maxCounts[1] = 1
  }

  for (let i = 1; i < maxCounts.length; ++i) {
    maxCounts[i] = maxCounts[i - 1] * 9 + Math.pow(10, i - 1)
  }

  const p = Math.pow(10, d)
  const msd = Math.floor(n / p)

  if (msd === target) {
    return msd * maxCounts[d] + (n % p) + 1
  }

  if (msd > target) {
    return (msd - 1) * maxCounts[d] + p + count(target, n % p)
  }

  return msd * maxCounts[d] + count(target, n % p)
}

console.log('g(7)', count(7, 7))
console.log('g(20)', count(7, 20))
console.log('g(70)', count(7, 70))
console.log('g(80)', count(7, 80))
console.log('g(100)', count(7, 100))
console.log('g(1000)', count(7, 1000))
