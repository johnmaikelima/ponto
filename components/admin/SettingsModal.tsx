"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Settings, Upload, X, Building2 } from "lucide-react"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function SettingsModal({ open, onOpenChange, onSuccess }: SettingsModalProps) {
  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyCnpj, setCompanyCnpj] = useState("")
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open])

  const loadSettings = async () => {
    try {
      setLoadingSettings(true)
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setCompanyName(data.companyName || "")
        setCompanyAddress(data.companyAddress || "")
        setCompanyPhone(data.companyPhone || "")
        setCompanyEmail(data.companyEmail || "")
        setCompanyCnpj(data.companyCnpj || "")
        setCompanyLogo(data.companyLogo || null)
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A logo deve ter no máximo 2MB",
        variant: "destructive",
      })
      return
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      })
      return
    }

    // Converter para base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setCompanyLogo(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setCompanyLogo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          companyAddress,
          companyPhone,
          companyEmail,
          companyCnpj,
          companyLogo,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao salvar configurações")
      }

      toast({
        title: "Sucesso!",
        description: "Configurações salvas com sucesso",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações da Empresa
          </DialogTitle>
          <DialogDescription>
            Configure as informações da sua empresa
          </DialogDescription>
        </DialogHeader>

        {loadingSettings ? (
          <div className="py-8 text-center text-gray-500">
            Carregando...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <div className="flex items-start gap-4">
                  {companyLogo ? (
                    <div className="relative">
                      <img
                        src={companyLogo}
                        alt="Logo"
                        className="h-24 w-24 object-contain border rounded-lg p-2"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {companyLogo ? "Alterar Logo" : "Fazer Upload"}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG ou GIF (máx. 2MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Nome da Empresa */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Construtora ABC"
                  required
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-2">
                <Label htmlFor="companyCnpj">CNPJ</Label>
                <Input
                  id="companyCnpj"
                  value={companyCnpj}
                  onChange={(e) => setCompanyCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              {/* Endereço */}
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Endereço</Label>
                <Input
                  id="companyAddress"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>

              {/* Telefone e Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input
                    id="companyPhone"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
