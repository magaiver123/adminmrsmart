"use client"

import { useState, useEffect } from "react"
import {
  User,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function PerfilPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch("/api/admin/profile")
      const data = await res.json()
      if (res.ok) {
        setFullName(data.name || "")
        setEmail(data.email || "")
        setRole(data.role || "")
      }
    }
    loadProfile()
  }, [])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setMessage(null)

    const res = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "name", name: fullName }),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage({ type: "error", text: data.error })
    } else {
      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" })
    }

    setIsSaving(false)
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem." })
      return
    }

    setIsChangingPassword(true)
    setMessage(null)

    const res = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "password",
        currentPassword,
        newPassword,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage({ type: "error", text: data.error })
    } else {
      setMessage({ type: "success", text: "Senha alterada com sucesso!" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }

    setIsChangingPassword(false)
  }

  return (
    <AdminLayout title="Meu Perfil">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Meu Perfil
          </h2>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e segurança
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder.svg" alt={fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{fullName}</CardTitle>
              <CardDescription>{email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Função:
                  </span>
                  <span className="font-medium">
                    {role || "Nao informado"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">
                    Informações
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    Segurança
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="profile" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) =>
                          setFullName(e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={email}
                        disabled
                        className="pl-9 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 mt-0">
                  {/* Senha Atual */}
                  <div className="space-y-2">
                    <Label>Senha Atual</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) =>
                        setCurrentPassword(e.target.value)
                      }
                    />
                  </div>

                  {/* Nova Senha */}
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                    />
                  </div>

                  {/* Confirmar */}
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      isChangingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="w-full"
                  >
                    {isChangingPassword
                      ? "Alterando..."
                      : "Alterar Senha"}
                  </Button>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
