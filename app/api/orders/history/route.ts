export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { formatOrderNumber } from "@/lib/tracking"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

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

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["CONCLUIDO", "CANCELADO"] },
        ...(createdAtFilter.gte || createdAtFilter.lte ? { createdAt: createdAtFilter } : {}),
      },
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
      take: 100,
    })

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

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("History error:", error)
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 })
  }
}
