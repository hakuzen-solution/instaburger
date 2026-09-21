export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { formatOrderNumber } from "@/lib/tracking"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const order = await prisma.order.findUnique({
      where: { trackingCode: code?.toUpperCase?.() ?? '' },
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
    })

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      orderNumber: formatOrderNumber(order.orderNumber),
      trackingCode: order.trackingCode,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt?.toISOString?.() ?? null,
      completedAt: order.completedAt?.toISOString?.() ?? null,
    })
  } catch (error: any) {
    console.error("Tracking error:", error)
    return NextResponse.json({ error: "Erro ao buscar pedido" }, { status: 500 })
  }
}
