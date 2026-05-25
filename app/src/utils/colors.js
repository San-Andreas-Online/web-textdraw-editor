export function hexToRGBA(n) {
  n = n >>> 0
  return { r: (n >>> 24) & 0xFF, g: (n >>> 16) & 0xFF, b: (n >>> 8) & 0xFF, a: n & 0xFF }
}

export function rgbaToCSS(n) {
  const { r, g, b, a } = hexToRGBA(n)
  return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`
}

export function numToHex8(n) {
  return `0x${(n >>> 0).toString(16).toUpperCase().padStart(8, '0')}`
}

export function numToHex6(n) {
  const { r, g, b } = hexToRGBA(n)
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

export function cssToNum(hex6, alpha = 255) {
  const s = hex6.replace('#', '')
  const r = parseInt(s.slice(0, 2), 16)
  const g = parseInt(s.slice(2, 4), 16)
  const b = parseInt(s.slice(4, 6), 16)
  return (((r << 24) | (g << 16) | (b << 8) | alpha) >>> 0)
}
