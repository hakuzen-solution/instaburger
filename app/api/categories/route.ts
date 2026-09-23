export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/require-admin-session"
import { prisma } from "@/lib/db"
import { categoryCreateSchema, firstValidationError } from "@/lib/validation"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("active") === "true"

    const categories = await prisma.category.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    })
    return NextResponse.json(categories ?? [])
  } catch (error: any) {
    console.error("Categories GET error:", error)
    return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { unauthorized } = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const parsed = categoryCreateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 })
    }
    const data = parsed.data

    const category = await prisma.category.create({
      data: {
        name: data.name,
        active: data.active ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error("Category create error:", error)
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 })
  }
}
