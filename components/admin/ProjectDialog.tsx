"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { TRACKING_MODES } from "@/lib/tracking-modes"

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: any
  companies: any[]
  onSuccess: () => void
}

export default function ProjectDialog({ open, onOpenChange, project, companies, onSuccess }: ProjectDialogProps) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [active, setActive] = useState(true)
  const [trackingMode, setTrackingMode] = useState("SIMPLE")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (project) {
      setName(project.name || "")
      setLocation(project.location || "")
      setDescription(project.description || "")
      setCompanyId(project.companyId || "")
      setActive(project.active !== undefined ? project.active : true)
      setTrackingMode(project.trackingMode || "SIMPLE")
    } else {
      setName("")
      setLocation("")
      setDescription("")
      setCompanyId("")
      setActive(true)
      setTrackingMode("SIMPLE")
    }
  }, [project, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = project ? `/api/projects/${project.id}` : "/api/projects"
      const method = project ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, location, description, companyId, active, trackingMode }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao salvar obra")
      }

      toast({
        title: "Sucesso!",
        description: project ? "Obra atualizada com sucesso" : "Obra criada com sucesso",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Editar Obra" : "Nova Obra"}</DialogTitle>
          <DialogDescription>
            {project ? "Atualize as informações da obra" : "Preencha os dados da nova obra"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da obra"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Endereço da obra"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da obra"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Select value={companyId} onValueChange={setCompanyId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingMode">Modo de Marcação *</Label>
              <Select value={trackingMode} onValueChange={setTrackingMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRACKING_MODES).map(([key, mode]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{mode.label}</span>
                        <span className="text-xs text-gray-500">{mode.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {trackingMode && TRACKING_MODES[trackingMode as keyof typeof TRACKING_MODES] && (
                <p className="text-xs text-gray-500 mt-1">
                  {TRACKING_MODES[trackingMode as keyof typeof TRACKING_MODES].description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="active">Status *</Label>
              <Select value={active ? "true" : "false"} onValueChange={(value) => setActive(value === "true")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativa</SelectItem>
                  <SelectItem value="false">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
