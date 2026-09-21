"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Truck, ClipboardList, PlusCircle, History, UtensilsCrossed, FolderOpen, LogOut, Menu, X, Zap, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin/pedidos-ativos", label: "Pedidos Ativos", icon: ClipboardList },
  { href: "/admin/pedido-rapido", label: "Modo Rápido", icon: Zap },
  { href: "/admin/novo-pedido", label: "Novo Pedido", icon: PlusCircle },
  { href: "/admin/historico", label: "Histórico", icon: History },
  { href: "/admin/produtos", label: "Produtos", icon: UtensilsCrossed },
  { href: "/admin/categorias", label: "Categorias", icon: FolderOpen },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg hidden sm:block">FoodTruck</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-1.5 text-sm",
                      isActive && "shadow-sm"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ redirectTo: "/login" })}
              className="gap-1.5 text-sm text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile nav */}
        {open && (
          <nav className="md:hidden pb-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <Button
              variant="ghost"
              onClick={() => signOut({ redirectTo: "/login" })}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}
