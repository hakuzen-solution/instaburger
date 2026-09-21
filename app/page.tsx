import { TrackingHome } from "@/components/tracking-home"
import { Truck } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">FoodTruck Pedidos</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold tracking-tight mb-2">Acompanhe seu Pedido</h2>
            <p className="text-muted-foreground">Digite o código de acompanhamento recebido no momento do pedido</p>
          </div>
          <TrackingHome />
        </div>
      </main>
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <p>FoodTruck Pedidos</p>
      </footer>
    </div>
  )
}
