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
    name: string
    location: string
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

  const handleClockIn = async (type: "ENTRY" | "EXIT" | "HOTEL_DEPARTURE") => {
    // Verificar se aceitou o termo
    if (!hasAcceptedTerm) {
      setShowTermModal(true)
      return
    }

    if (!selectedProject) {
      toast({
        title: "Selecione uma obra",
        description: "Por favor, selecione uma obra antes de marcar o ponto",
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
          type,
          latitude,
          longitude,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao registrar ponto")
      }

      const newRecord = await response.json()

      const titles = {
        ENTRY: "Entrada registrada",
        EXIT: "Saída registrada",
        HOTEL_DEPARTURE: "Saída do hotel registrada"
      }

      toast({
        title: titles[type],
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

  const lastRecord = records[0]
  const isWithHotelMode = selectedProjectData?.trackingMode === "WITH_HOTEL"
  
  // Lógica para modo WITH_HOTEL
  const canHotelDeparture = isWithHotelMode && (!lastRecord || lastRecord.type === "EXIT")
  const canClockIn = isWithHotelMode 
    ? (lastRecord && lastRecord.type === "HOTEL_DEPARTURE")
    : (!lastRecord || lastRecord.type === "EXIT")
  const canClockOut = lastRecord && lastRecord.type === "ENTRY"

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
                <Label htmlFor="project">Selecione a Obra</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Escolha uma obra" />
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

              {isWithHotelMode ? (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleClockIn("HOTEL_DEPARTURE")}
                    disabled={isLoading || !canHotelDeparture}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Saída do Hotel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleClockIn("ENTRY")}
                      disabled={isLoading || !canClockIn}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Entrada na Obra
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => handleClockIn("EXIT")}
                      disabled={isLoading || !canClockOut}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Saída da Obra
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleClockIn("ENTRY")}
                    disabled={isLoading || !canClockIn}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Entrada
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => handleClockIn("EXIT")}
                    disabled={isLoading || !canClockOut}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Saída
                  </Button>
                </div>
              )}

              {lastRecord && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Último registro: {lastRecord.type === "ENTRY" ? "Entrada" : lastRecord.type === "EXIT" ? "Saída" : "Saída do Hotel"}
                  </p>
                  <p className="text-sm text-blue-700">
                    {format(new Date(lastRecord.timestamp), "HH:mm", { locale: ptBR })} - {lastRecord.project.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.type === "ENTRY" ? "bg-green-100" : record.type === "EXIT" ? "bg-red-100" : "bg-yellow-100"
                      }`}>
                        <Clock className={`w-5 h-5 ${
                          record.type === "ENTRY" ? "text-green-600" : record.type === "EXIT" ? "text-red-600" : "text-yellow-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            {record.type === "ENTRY" ? "Entrada" : record.type === "EXIT" ? "Saída" : "Saída do Hotel"}
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
                  ))}
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
