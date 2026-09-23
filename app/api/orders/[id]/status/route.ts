export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/require-admin-session"
import { prisma } from "@/lib/db"

const VALID_TRANSITIONS: Record<string, string[]> = {
  NOVO: ["PREPARANDO", "CANCELADO"],
  PREPARANDO: ["PRONTO", "CANCELADO"],
  PRONTO: ["CONCLUIDO"],
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const { status } = await req.json()

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const allowed = VALID_TRANSITIONS[order.status] ?? []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Transição de ${order.status} para ${status} não permitida` },
        { status: 400 }
      )
    }

    const updateData: any = { status, updatedAt: new Date() }
    if (status === "CONCLUIDO" || status === "CANCELADO") {
      updateData.completedAt = new Date()
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ id: updated.id, status: updated.status })
  } catch (error: any) {
    console.error("Update status error:", error)
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
  }
}
