// Safe charset: no 0, O, I, L, 1
const SAFE_CHARS = '23456789ABCDEFGHJKMNPRSTUVWXYZ'

export function generateTrackingCode(): string {
  let part1 = ''
  let part2 = ''
  for (let i = 0; i < 4; i++) {
    part1 += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  }
  for (let i = 0; i < 3; i++) {
    part2 += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  }
  return `${part1}-${part2}`
}

export async function getNextOrderNumber(prismaClient: any): Promise<number> {
  // Get start of today in Asia/Tokyo
  const now = new Date()
  const tokyoStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })
  const startOfDay = new Date(`${tokyoStr}T00:00:00+09:00`)
  const endOfDay = new Date(`${tokyoStr}T23:59:59.999+09:00`)

  const count = await prismaClient.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  })
  return count + 1
}

export function formatOrderNumber(num: number): string {
  return `#${String(num).padStart(3, '0')}`
}
