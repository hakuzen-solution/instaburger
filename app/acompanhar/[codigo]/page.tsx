import { TrackingStatus } from "@/components/tracking-status"
import { Truck, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="bg-primary p-2 rounded-lg">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-display font-bold tracking-tight">Acompanhamento</h1>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          <TrackingStatus code={codigo ?? ''} />
        </div>
      </main>
    </div>
  )
}
