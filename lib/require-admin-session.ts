import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function requireAdminSession() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "admin") {
    return {
      session: null,
      unauthorized: NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
    }
  }
  return { session, unauthorized: null }
}
