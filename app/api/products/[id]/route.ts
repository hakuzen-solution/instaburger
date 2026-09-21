export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

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
    const data = await req.json()
    const updateData: any = {}
    if (data?.name !== undefined) updateData.name = data.name
    if (data?.description !== undefined) updateData.description = data.description
    if (data?.price !== undefined) updateData.price = Number(data.price)
    if (data?.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data?.active !== undefined) updateData.active = data.active
    if (data?.displayOrder !== undefined) updateData.displayOrder = Number(data.displayOrder)

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(product)
  } catch (error: any) {
    console.error("Product update error:", error)
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 })
  }
}
