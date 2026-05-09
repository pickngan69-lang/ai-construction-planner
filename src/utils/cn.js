export function cn(...args) {
  return args
    .flat(Infinity)
    .filter((v) => typeof v === 'string' && v.length > 0)
    .join(' ')
}
