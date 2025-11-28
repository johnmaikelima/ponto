"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileText, Save, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface DailyNotesCardProps {
  projectId: string
  projectName: string
}

export default function DailyNotesCard({ projectId, projectName }: DailyNotesCardProps) {
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  // Carregar anotações ao selecionar obra
  useEffect(() => {
    if (!projectId) {
      setNotes("")
      setLoading(false)
      return
    }

    const loadNotes = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/daily-notes?projectId=${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setNotes(data.notes || "")
          setHasChanges(false)
        }
      } catch (error) {
        console.error("Erro ao carregar anotações:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotes()
  }, [projectId])

  const handleSave = async () => {
    if (!projectId) return

    setSaving(true)
    try {
      const response = await fetch("/api/daily-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar anotações")
      }

      toast({
        title: "Anotações salvas!",
        description: "Suas observações foram salvas com sucesso",
      })
      setHasChanges(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as anotações",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (value: string) => {
    setNotes(value)
    setHasChanges(true)
  }

  if (!projectId) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <CardTitle>Anotações do Dia</CardTitle>
          </div>
          <CardDescription>
            Selecione uma OS para adicionar observações
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle>Anotações do Dia</CardTitle>
        </div>
        <CardDescription>
          Observações sobre o trabalho em: {projectName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <Textarea
              value={notes}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Descreva o que foi feito hoje, materiais utilizados, problemas encontrados, etc..."
              className="min-h-[120px] resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {hasChanges ? "Alterações não salvas" : "Salvo automaticamente"}
              </p>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
