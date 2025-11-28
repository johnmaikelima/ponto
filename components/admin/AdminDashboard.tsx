"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, LogOut, Users, Building2, Briefcase, Download, Settings, FileText, Calendar } from "lucide-react"
import RecordsTable from "./RecordsTable"
import EmployeesManager from "./EmployeesManager"
import ProjectsManager from "./ProjectsManager"
import CompaniesManager from "./CompaniesManager"
import TermAcceptanceViewer from "./TermAcceptanceViewer"
import SettingsModal from "./SettingsModal"
import ReportsManager from "./ReportsManager"
import NotesManager from "./NotesManager"
import AttendanceCalendar from "./AttendanceCalendar"
import { useRouter } from "next/navigation"

interface AdminDashboardProps {
  user: {
    name: string
    email: string
  }
  employees: any[]
  companies: any[]
  projects: any[]
  recentRecords: any[]
  termAcceptances: any[]
  dailyNotes: any[]
}

export default function AdminDashboard({
  user,
  employees,
  companies,
  projects,
  recentRecords,
  termAcceptances,
  dailyNotes,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const router = useRouter()

  const handleExportRecords = async () => {
    try {
      const response = await fetch("/api/export/records")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `registros-ponto-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro ao exportar:", error)
    }
  }

  return (
    <>
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        onSuccess={() => router.refresh()}
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
              <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-sm text-gray-500">{user.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button variant="outline" onClick={handleExportRecords}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-auto lg:grid-cols-9">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="records">Registros</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="notes">Anotações</TabsTrigger>
            <TabsTrigger value="attendance">Frequência</TabsTrigger>
            <TabsTrigger value="employees">Funcionários</TabsTrigger>
            <TabsTrigger value="projects">OS</TabsTrigger>
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="terms">Termos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Funcionários
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employees.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Ativos no sistema
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Empresas
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{companies.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Cadastradas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total OS
                  </CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {projects.filter(p => p.active).length} ativas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Registros Hoje
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentRecords.filter(r => {
                      const today = new Date()
                      const recordDate = new Date(r.timestamp)
                      return recordDate.toDateString() === today.toDateString()
                    }).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Marcações de ponto
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Registros Recentes</CardTitle>
                <CardDescription>Últimos 50 registros de ponto</CardDescription>
              </CardHeader>
              <CardContent>
                <RecordsTable records={recentRecords} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Registros</CardTitle>
                <CardDescription>Visualize e filtre os registros de ponto</CardDescription>
              </CardHeader>
              <CardContent>
                <RecordsTable records={recentRecords} showFilters />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportsManager 
              companies={companies}
              projects={projects}
              employees={employees}
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <NotesManager 
              initialNotes={dailyNotes}
              projects={projects}
              employees={employees}
            />
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <AttendanceCalendar employees={employees} />
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees">
            <EmployeesManager employees={employees} companies={companies} />
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <ProjectsManager projects={projects} companies={companies} />
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <CompaniesManager companies={companies} />
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms">
            <TermAcceptanceViewer acceptances={termAcceptances} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </>
  )
}
