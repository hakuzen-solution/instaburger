export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/require-admin-session"
import { prisma } from "@/lib/db"
import { categoryUpdateSchema, firstValidationError } from "@/lib/validation"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const parsed = categoryUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 })
    }
    const data = parsed.data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.active !== undefined) updateData.active = data.active
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(category)
  } catch (error: any) {
    console.error("Category update error:", error)
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 })
  }
}
