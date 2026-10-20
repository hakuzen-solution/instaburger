export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/require-admin-session"
import { prisma } from "@/lib/db"

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * 60 * 60 * 1000
const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const MAX_DAYS = 366

export async function GET(request: Request) {
  const { unauthorized } = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!from || !to || !DATE_ONLY.test(from) || !DATE_ONLY.test(to)) {
      return NextResponse.json({ error: "Informe a data inicial e a data final" }, { status: 400 })
    }

    // O "dia" do negócio é o dia no Japão (UTC+9); o servidor roda em UTC
    const start = new Date(`${from}T00:00:00+09:00`)
    const end = new Date(`${to}T23:59:59.999+09:00`)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Datas inválidas" }, { status: 400 })
    }
    if (start > end) {
      return NextResponse.json({ error: "A data inicial deve ser anterior à data final" }, { status: 400 })
    }
    if ((end.getTime() - start.getTime()) / DAY_MS > MAX_DAYS) {
      return NextResponse.json({ error: "O intervalo máximo é de 1 ano" }, { status: 400 })
    }

    const inRange = { createdAt: { gte: start, lte: end } }
    const counted = { ...inRange, status: { not: "CANCELADO" } }

    const [totals, cancelledCount, orders, products] = await Promise.all([
      prisma.order.aggregate({ where: counted, _sum: { totalAmount: true }, _count: true }),
      prisma.order.count({ where: { ...inRange, status: "CANCELADO" } }),
      prisma.order.findMany({ where: counted, select: { createdAt: true, totalAmount: true } }),
      prisma.orderItem.groupBy({
        by: ["productNameSnapshot"],
        where: { order: counted },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { subtotal: "desc" } },
      }),
    ])

    const revenue = totals._sum.totalAmount ?? 0
    const orderCount = totals._count

    const byDay = new Map<string, { orders: number; revenue: number }>()
    for (const o of orders) {
      const day = new Date(o.createdAt.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10)
      const entry = byDay.get(day) ?? { orders: 0, revenue: 0 }
      entry.orders += 1
      entry.revenue += o.totalAmount
      byDay.set(day, entry)
    }
    const days = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, orders: v.orders, revenue: v.revenue }))

    return NextResponse.json({
      from,
      to,
      revenue,
      orderCount,
      averageTicket: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      cancelledCount,
      days,
      products: products.map((p) => ({
        name: p.productNameSnapshot,
        quantity: p._sum.quantity ?? 0,
        revenue: p._sum.subtotal ?? 0,
      })),
    })
  } catch (error: any) {
    console.error("Closing report error:", error)
    return NextResponse.json({ error: "Erro ao calcular o fechamento" }, { status: 500 })
  }
}
