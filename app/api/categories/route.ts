export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

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
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const category = await prisma.category.create({
      data: {
        name: data?.name ?? '',
        active: data?.active !== false,
        displayOrder: Number(data?.displayOrder ?? 0),
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error("Category create error:", error)
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 })
  }
}
