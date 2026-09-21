export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user?.password) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }
    return NextResponse.json({ id: user.id, email: user.email, name: user.name })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
