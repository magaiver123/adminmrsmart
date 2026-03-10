"use client"

import Link from "next/link"
import Image from "next/image"
import { Building2, Globe, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AmbientesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center gap-4">
          <Image src="/logo.svg" alt="Mr Smart" width={52} height={52} priority />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Central de Ambientes</h1>
            <p className="text-sm text-slate-600">
              Escolha onde deseja trabalhar agora.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Link href="/dashboard" className="group">
            <Card className="h-full border-slate-200 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle>Operação por Loja</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Acesse os módulos operacionais com loja ativa: dashboard,
                  totems, produtos, categorias, estoque, tela inicial e pedidos.
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-orange-600">
                  Entrar
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/lojas" className="group">
            <Card className="h-full border-slate-200 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Globe className="h-5 w-5" />
                </div>
                <CardTitle>Ambiente Global</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gerencie governança e cadastro mestre: lojas, usuários,
                  usuários admin, configurações, auditoria, produtos e categorias globais.
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
                  Entrar
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
