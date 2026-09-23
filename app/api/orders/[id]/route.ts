export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/require-admin-session"
import { prisma } from "@/lib/db"
import { formatOrderNumber } from "@/lib/tracking"
import { orderWriteSchema, firstValidationError } from "@/lib/validation"

// Edit an order's items and/or notes (only while NOVO or PREPARANDO)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const parsed = orderWriteSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 })
    }
    const { items, notes } = parsed.data

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
    return NextResponse.json({ error: "Erro ao editar pedido" }, { status: 500 })
  }
}
