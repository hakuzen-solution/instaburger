export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/require-admin-session"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("active") === "true"

    const products = await prisma.product.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }, { name: "asc" }],
    })

    return NextResponse.json(products ?? [])
  } catch (error: any) {
    console.error("Products GET error:", error)
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { unauthorized } = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const data = await req.json()
    const product = await prisma.product.create({
      data: {
        name: data?.name ?? '',
        description: data?.description ?? null,
        price: Number(data?.price ?? 0),
        categoryId: data?.categoryId ?? '',
        active: data?.active !== false,
        displayOrder: Number(data?.displayOrder ?? 0),
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error("Product create error:", error)
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 })
  }
}
