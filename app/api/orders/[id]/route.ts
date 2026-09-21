export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { formatOrderNumber } from "@/lib/tracking"

// Edit an order's items and/or notes (only while NOVO or PREPARANDO)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const { items, notes } = await req.json()

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    if (order.status !== "NOVO" && order.status !== "PREPARANDO") {
      return NextResponse.json(
        { error: "Só é possível editar pedidos em preparo ou novos" },
        { status: 400 }
      )
    }

    if (!items?.length) {
      return NextResponse.json({ error: "O pedido deve ter ao menos um item" }, { status: 400 })
    }

    // Rebuild items from current products
    const productIds = items.map((i: any) => i?.productId).filter(Boolean)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const productMap = new Map(products.map((p: any) => [p.id, p]))

    let totalAmount = 0
    const orderItems = items.map((item: any) => {
      const product = productMap.get(item?.productId)
      if (!product) throw new Error(`Produto não encontrado: ${item?.productId}`)
      const quantity = Math.max(1, Number(item?.quantity ?? 1))
      const subtotal = (product?.price ?? 0) * quantity
      totalAmount += subtotal
      return {
        productId: product.id,
        productNameSnapshot: product?.name ?? "Produto",
        unitPrice: product?.price ?? 0,
        quantity,
        subtotal,
      }
    })

    // Replace items and update notes/total atomically
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.order.update({
        where: { id },
        data: {
          totalAmount,
          notes: typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 500) : null,
          updatedAt: new Date(),
          items: { create: orderItems },
        },
      }),
    ])

    const updated = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    return NextResponse.json({
      id: updated?.id,
      orderNumber: formatOrderNumber(updated?.orderNumber ?? 0),
      status: updated?.status,
      totalAmount: updated?.totalAmount,
      notes: updated?.notes ?? null,
      items: updated?.items ?? [],
    })
  } catch (error: any) {
    console.error("Edit order error:", error)
    return NextResponse.json({ error: error?.message ?? "Erro ao editar pedido" }, { status: 500 })
  }
}
