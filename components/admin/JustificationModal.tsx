"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Upload, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface JustificationModalProps {
  open: boolean
  onClose: () => void
  date: Date
  userId: string
  existingJustification?: any
  onSaved: () => void
}

const JUSTIFICATION_TYPES = [
  { value: "MEDICAL_LEAVE", label: "Falta Abonada (Atestado)", icon: "🟡" },
  { value: "AUTHORIZED_LEAVE", label: "Falta Autorizada (Diretoria)", icon: "🔵" },
  { value: "TIME_BANK", label: "Banco de Horas", icon: "🟣" },
  { value: "UNJUSTIFIED", label: "Falta Injustificada (Descontar)", icon: "🟠" },
  { value: "VACATION", label: "Férias", icon: "🏖️" },
  { value: "COMPENSATORY", label: "Folga Compensatória", icon: "💼" },
]

export default function JustificationModal({
  open,
  onClose,
  date,
  userId,
  existingJustification,
  onSaved
}: JustificationModalProps) {
  const [type, setType] = useState(existingJustification?.type || "")
  const [notes, setNotes] = useState(existingJustification?.notes || "")
  const [attachment, setAttachment] = useState<string | null>(existingJustification?.attachment || null)
  const [fileName, setFileName] = useState<string | null>(existingJustification?.fileName || null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (existingJustification) {
      setType(existingJustification.type)
      setNotes(existingJustification.notes || "")
      setAttachment(existingJustification.attachment || null)
      setFileName(existingJustification.fileName || null)
    } else {
      setType("")
      setNotes("")
      setAttachment(null)
      setFileName(null)
    }
  }, [existingJustification, open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limitar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive",
      })
      return
    }

    // Converter para base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setAttachment(reader.result as string)
      setFileName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!type) {
      toast({
        title: "Tipo obrigatório",
        description: "Selecione o tipo de justificativa",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const url = existingJustification
        ? `/api/justifications/${existingJustification.id}`
        : "/api/justifications"
      
      const method = existingJustification ? "PUT" : "POST"
      
      const body: any = {
        type,
        notes: notes || null,
        attachment,
        fileName,
      }

      if (!existingJustification) {
        body.userId = userId
        body.date = format(date, "yyyy-MM-dd")
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao salvar")
      }

      toast({
        title: "Justificativa salva!",
        description: existingJustification 
          ? "A justificativa foi atualizada com sucesso"
          : "A justificativa foi adicionada com sucesso",
      })

      onSaved()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a justificativa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!existingJustification) return

    if (!confirm("Tem certeza que deseja remover esta justificativa?")) return

    setLoading(true)
    try {
      const response = await fetch(`/api/justifications/${existingJustification.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao remover")
      }

      toast({
        title: "Justificativa removida!",
        description: "A justificativa foi removida com sucesso",
      })

      onSaved()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a justificativa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {existingJustification ? "Editar Justificativa" : "Adicionar Justificativa"}
          </DialogTitle>
          <DialogDescription>
            {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de Justificativa */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Justificativa *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {JUSTIFICATION_TYPES.map((jType) => (
                  <SelectItem key={jType.value} value={jType.value}>
                    <span className="flex items-center gap-2">
                      <span>{jType.icon}</span>
                      <span>{jType.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione detalhes sobre a justificativa..."
              className="min-h-[100px]"
            />
          </div>

          {/* Anexo */}
          <div className="space-y-2">
            <Label htmlFor="attachment">Anexo (Atestado, Autorização, etc.)</Label>
            {fileName ? (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm flex-1 truncate">{fileName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAttachment(null)
                    setFileName(null)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="attachment"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Upload className="w-4 h-4" />
                    <span>Escolher arquivo (máx. 5MB)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {existingJustification && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
