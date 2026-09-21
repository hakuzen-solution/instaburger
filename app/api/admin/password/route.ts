export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Preencha a senha atual e a nova senha" },
        { status: 400 }
      )
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter ao menos 6 caracteres" },
        { status: 400 }
      )
    }

    const userId = (session.user as any)?.id
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email: String(session.user.email || "") } })

    if (!user?.password) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const isValid = await bcrypt.compare(String(currentPassword), user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(String(newPassword), 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 })
  }
}
