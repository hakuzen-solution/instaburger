export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { generateTrackingCode, getNextOrderNumber, formatOrderNumber } from "@/lib/tracking"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { items, notes } = await req.json()
    if (!items?.length) {
      return NextResponse.json({ error: "Adicione itens ao pedido" }, { status: 400 })
    }

    // Get products
    const productIds = items.map((i: any) => i?.productId).filter(Boolean)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })
    const productMap = new Map(products.map((p: any) => [p.id, p]))

    // Calculate total and build order items
    let totalAmount = 0
    const orderItems = items.map((item: any) => {
      const product = productMap.get(item?.productId)
      if (!product) throw new Error(`Produto não encontrado: ${item?.productId}`)
      const subtotal = (product?.price ?? 0) * (item?.quantity ?? 1)
      totalAmount += subtotal
      return {
        productId: product.id,
        productNameSnapshot: product?.name ?? 'Produto',
        unitPrice: product?.price ?? 0,
        quantity: item?.quantity ?? 1,
        subtotal,
      }
    })

    // Generate unique tracking code
    let trackingCode = generateTrackingCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.order.findUnique({ where: { trackingCode } })
      if (!existing) break
      trackingCode = generateTrackingCode()
      attempts++
    }

    const orderNumber = await getNextOrderNumber(prisma)

    const order = await prisma.order.create({
      data: {
        orderNumber,
        trackingCode,
        status: "NOVO",
        totalAmount,
        notes: typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 500) : null,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    })

    return NextResponse.json({
      id: order.id,
      orderNumber: formatOrderNumber(order.orderNumber),
      trackingCode: order.trackingCode,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items,
    }, { status: 201 })
  } catch (error: any) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: error?.message ?? "Erro ao criar pedido" }, { status: 500 })
  }
}
