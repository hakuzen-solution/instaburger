export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { formatOrderNumber } from "@/lib/tracking"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ["NOVO", "PREPARANDO", "PRONTO"] } },
      select: {
        id: true,
        orderNumber: true,
        trackingCode: true,
        status: true,
        totalAmount: true,
        notes: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            productNameSnapshot: true,
            unitPrice: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
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
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Active orders error:", error)
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
  }
}
