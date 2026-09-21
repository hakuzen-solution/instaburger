import { LoginForm } from "@/components/login-form"
import { Truck } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-primary p-3 rounded-xl inline-flex mb-4">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Acesso Administrativo</h1>
          <p className="text-muted-foreground mt-1">Entre com suas credenciais para acessar o sistema</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
