"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Clock, LogOut, MapPin, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import TermAcceptanceModal from "./TermAcceptanceModal"
import DailyNotesCard from "./DailyNotesCard"
import { TRACKING_MODES, getNextRecordType, getRecordTypeLabel, getRecordTypeColor, type TrackingModeKey } from "@/lib/tracking-modes"

interface Project {
  id: string
  name: string
  location: string
  trackingMode: string
  company: {
    name: string
  }
}

interface TimeRecord {
  id: string
  type: string
  timestamp: Date
  notes: string | null
  project: {
    id: string
    name: string
    location: string
    trackingMode: string
    company: {
      name: string
    }
  }
}

interface EmployeeDashboardProps {
  user: {
    name: string
    email: string
  }
  projects: Project[]
  todayRecords: TimeRecord[]
}

export default function EmployeeDashboard({ user, projects, todayRecords }: EmployeeDashboardProps) {
  const [selectedProject, setSelectedProject] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [records, setRecords] = useState(todayRecords)
  const [showTermModal, setShowTermModal] = useState(false)
  const [hasAcceptedTerm, setHasAcceptedTerm] = useState(false)
  const [checkingTerm, setCheckingTerm] = useState(true)
  const { toast } = useToast()

  // Verificar se o usuário já aceitou o termo
  useEffect(() => {
    const checkTermAcceptance = async () => {
      try {
        const response = await fetch("/api/term-acceptance")
        if (response.ok) {
          const data = await response.json()
          setHasAcceptedTerm(data.hasAccepted)
        }
      } catch (error) {
        console.error("Erro ao verificar aceite do termo:", error)
      } finally {
        setCheckingTerm(false)
      }
    }

    checkTermAcceptance()
  }, [])

  const selectedProjectData = projects.find(p => p.id === selectedProject)

  const handleClockIn = async () => {
    // Verificar se aceitou o termo
    if (!hasAcceptedTerm) {
      setShowTermModal(true)
      return
    }

    if (!selectedProject) {
      toast({
        title: "Selecione uma OS",
        description: "Por favor, selecione uma OS antes de marcar o ponto",
        variant: "destructive",
      })
      return
    }

    // Determinar o próximo tipo de registro baseado no modo de rastreamento
    const trackingMode = selectedProjectData?.trackingMode || "SIMPLE"
    // Filtrar apenas registros da obra selecionada
    const projectRecords = records.filter(r => r.project.id === selectedProject)
    const todayRecordTypes = projectRecords.map(r => r.type)
    const nextType = getNextRecordType(trackingMode as TrackingModeKey, todayRecordTypes)

    if (!nextType) {
      toast({
        title: "Fluxo completo",
        description: "Você já completou todos os registros de hoje para esta OS",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Tenta obter localização
      let latitude: number | null = null
      let longitude: number | null = null

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch (error) {
          console.log("Não foi possível obter localização")
        }
      }

      const response = await fetch("/api/time-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProject,
          type: nextType,
          latitude,
          longitude,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao registrar ponto")
      }

      const newRecord = await response.json()

      const trackingMode = selectedProjectData?.trackingMode || "SIMPLE"
      const label = getRecordTypeLabel(trackingMode as TrackingModeKey, nextType)

      toast({
        title: `${label} registrada`,
        description: `Ponto registrado com sucesso às ${format(new Date(newRecord.timestamp), "HH:mm", { locale: ptBR })}`,
      })

      // Atualiza a lista de registros
      setRecords([newRecord, ...records])
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar o ponto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTermAccepted = () => {
    setHasAcceptedTerm(true)
    setShowTermModal(false)
    toast({
      title: "Termo aceito!",
      description: "Agora você pode marcar o ponto normalmente",
    })
  }

  // Determinar próximo passo baseado no modo de rastreamento
  const trackingMode = selectedProjectData?.trackingMode || "SIMPLE"
  // Filtrar apenas registros da obra selecionada
  const projectRecords = selectedProject ? records.filter(r => r.project.id === selectedProject) : []
  const todayRecordTypes = projectRecords.map(r => r.type)
  const nextType = getNextRecordType(trackingMode as TrackingModeKey, todayRecordTypes)
  const nextLabel = nextType ? getRecordTypeLabel(trackingMode as TrackingModeKey, nextType) : null
  const lastRecord = projectRecords[0] // Último registro da obra selecionada

  if (checkingTerm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <TermAcceptanceModal 
        open={showTermModal} 
        onAccepted={handleTermAccepted}
        user={user}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sistema de Ponto</h1>
              <p className="text-sm text-gray-500">{user.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Marcar Ponto */}
          <Card>
            <CardHeader>
              <CardTitle>Marcar Ponto</CardTitle>
              <CardDescription>Registre sua entrada ou saída</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Selecione uma OS</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Escolha uma OS" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} - {project.company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleClockIn}
                disabled={isLoading || !nextType}
                size="lg"
              >
                <Clock className="w-5 h-5 mr-2" />
                {nextLabel || "Fluxo Completo"}
              </Button>

              {selectedProjectData && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 mb-1">Modo de Marcação:</p>
                  <p className="text-sm text-gray-900">
                    {TRACKING_MODES[trackingMode as TrackingModeKey]?.label || trackingMode}
                  </p>
                </div>
              )}

              {lastRecord && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Último registro: {getRecordTypeLabel(trackingMode as TrackingModeKey, lastRecord.type)}
                  </p>
                  <p className="text-sm text-blue-700">
                    {format(new Date(lastRecord.timestamp), "HH:mm", { locale: ptBR })} - {lastRecord.project.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anotações do Dia */}
          <DailyNotesCard 
            projectId={selectedProject} 
            projectName={selectedProjectData?.name || ""}
          />

          {/* Registros de Hoje */}
          <Card>
            <CardHeader>
              <CardTitle>Registros de Hoje</CardTitle>
              <CardDescription>
                {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nenhum registro hoje
                </p>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => {
                    const recordMode = record.project.trackingMode || "SIMPLE"
                    const colors = getRecordTypeColor(record.type)
                    const label = getRecordTypeLabel(recordMode as TrackingModeKey, record.type)
                    
                    return (
                    <div
                      key={record.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
                        <span className="text-xl">{colors.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium text-sm ${colors.text}`}>
                            {label}
                          </p>
                          <p className="text-sm font-semibold">
                            {format(new Date(record.timestamp), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {record.project.name} - {record.project.location}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.project.company.name}
                        </p>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    </>
  )
}
