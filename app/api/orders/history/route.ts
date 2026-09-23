export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/require-admin-session"
import { prisma } from "@/lib/db"
import { formatOrderNumber } from "@/lib/tracking"

export async function GET(request: Request) {
  const { unauthorized } = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const pageParam = parseInt(searchParams.get("page") ?? "1", 10)
    const pageSizeParam = parseInt(searchParams.get("pageSize") ?? "20", 10)
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
    const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 20

    const createdAtFilter: { gte?: Date; lte?: Date } = {}
    if (from) {
      const start = new Date(from)
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0)
        createdAtFilter.gte = start
      }
    }
    if (to) {
      const end = new Date(to)
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999)
        createdAtFilter.lte = end
      }
    }

    const where = {
      status: { in: ["CONCLUIDO", "CANCELADO"] },
      ...(createdAtFilter.gte || createdAtFilter.lte ? { createdAt: createdAtFilter } : {}),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            select: {
              productNameSnapshot: true,
              unitPrice: true,
              quantity: true,
              subtotal: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ])

    const result = (orders ?? []).map((o: any) => ({
      id: o?.id,
      orderNumber: formatOrderNumber(o?.orderNumber ?? 0),
      trackingCode: o?.trackingCode,
      status: o?.status,
      totalAmount: o?.totalAmount,
      notes: o?.notes ?? null,
      items: o?.items ?? [],
      createdAt: o?.createdAt?.toISOString?.() ?? null,
      completedAt: o?.completedAt?.toISOString?.() ?? null,
    }))

    return NextResponse.json({
      orders: result,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch (error: any) {
    console.error("History error:", error)
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 })
  }
}
