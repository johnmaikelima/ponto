"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Download, Search, Clock, Users, Briefcase, Calendar, FileDown } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ReportsManagerProps {
  companies: any[]
  projects: any[]
  employees: any[]
}

export default function ReportsManager({ companies, projects, employees }: ReportsManagerProps) {
  const [companyId, setCompanyId] = useState("all")
  const [projectId, setProjectId] = useState("all")
  const [userId, setUserId] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const { toast } = useToast()

  // Filtrar projetos por empresa selecionada
  const filteredProjects = companyId === "all" 
    ? projects 
    : projects.filter(p => p.companyId === companyId)

  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (companyId !== "all") params.append("companyId", companyId)
      if (projectId !== "all") params.append("projectId", projectId)
      if (userId !== "all") params.append("userId", userId)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/reports/hours?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Erro ao gerar relatório")
      }

      const data = await response.json()
      setReport(data)

      toast({
        title: "Relatório gerado!",
        description: `${data.summary.totalEmployees} funcionário(s), ${data.summary.totalHours.toFixed(2)} horas`,
      })
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

  const handleExportExcel = async () => {
    if (!report) return

    try {
      const params = new URLSearchParams()
      
      if (companyId !== "all") params.append("companyId", companyId)
      if (projectId !== "all") params.append("projectId", projectId)
      if (userId !== "all") params.append("userId", userId)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/reports/export?${params.toString()}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `relatorio-horas-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportado!",
        description: "Relatório Excel baixado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive",
      })
    }
  }

  const handleExportPDF = async () => {
    if (!report) return

    try {
      const params = new URLSearchParams()
      
      if (companyId !== "all") params.append("companyId", companyId)
      if (projectId !== "all") params.append("projectId", projectId)
      if (userId !== "all") params.append("userId", userId)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/reports/pdf?${params.toString()}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `relatorio-horas-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportado!",
        description: "Relatório PDF baixado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setCompanyId("all")
    setProjectId("all")
    setUserId("all")
    setStartDate("")
    setEndDate("")
    setReport(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatório de Horas Trabalhadas
          </CardTitle>
          <CardDescription>
            Gere relatórios detalhados de horas por funcionário, obra ou empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Search className="w-4 h-4" />
                Filtros
              </h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Empresa */}
              <div className="space-y-2">
                <Label htmlFor="company-filter">Empresa</Label>
                <Select value={companyId} onValueChange={(value) => {
                  setCompanyId(value)
                  setProjectId("all") // Reset project when company changes
                }}>
                  <SelectTrigger id="company-filter">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ordem de Serviço */}
              <div className="space-y-2">
                <Label htmlFor="project-filter">Ordem de Serviço</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger id="project-filter">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Ordens de Serviço</SelectItem>
                    {filteredProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Funcionário */}
              <div className="space-y-2">
                <Label htmlFor="user-filter">Funcionário</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger id="user-filter">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os funcionários</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data Início */}
              <div className="space-y-2">
                <Label htmlFor="start-date">Data Início</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* Data Fim */}
              <div className="space-y-2">
                <Label htmlFor="end-date">Data Fim</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenerateReport} disabled={loading} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                {loading ? "Gerando..." : "Gerar Relatório"}
              </Button>
              {report && (
                <>
                  <Button onClick={handleExportPDF} variant="outline">
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={handleExportExcel} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Resumo */}
          {report && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Funcionários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-2xl font-bold">{report.summary.totalEmployees}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Ordens de Serviço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-600" />
                      <span className="text-2xl font-bold">{report.summary.totalProjects}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total de Horas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-2xl font-bold">{report.summary.totalHours.toFixed(2)}h</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Dias Trabalhados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-2xl font-bold">{report.summary.totalDays}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Resultados */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Funcionário</th>
                        <th className="text-left p-3 text-sm font-medium">Ordem de Serviço</th>
                        <th className="text-left p-3 text-sm font-medium">Empresa</th>
                        <th className="text-right p-3 text-sm font-medium">Dias</th>
                        <th className="text-right p-3 text-sm font-medium">Total Horas</th>
                        <th className="text-right p-3 text-sm font-medium">Média/Dia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.report.map((item: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm">
                            <div>{item.userName}</div>
                            <div className="text-xs text-gray-500">{item.userEmail}</div>
                          </td>
                          <td className="p-3 text-sm">{item.projectName}</td>
                          <td className="p-3 text-sm">{item.companyName}</td>
                          <td className="p-3 text-sm text-right">{item.totalDays}</td>
                          <td className="p-3 text-sm text-right font-medium">
                            {item.totalHours.toFixed(2)}h
                          </td>
                          <td className="p-3 text-sm text-right text-gray-600">
                            {item.totalDays > 0 ? (item.totalHours / item.totalDays).toFixed(2) : "0.00"}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-medium">
                      <tr>
                        <td colSpan={3} className="p-3 text-sm">TOTAL GERAL</td>
                        <td className="p-3 text-sm text-right">{report.summary.totalDays}</td>
                        <td className="p-3 text-sm text-right">{report.summary.totalHours.toFixed(2)}h</td>
                        <td className="p-3 text-sm text-right">
                          {report.summary.totalDays > 0 
                            ? (report.summary.totalHours / report.summary.totalDays).toFixed(2) 
                            : "0.00"}h
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          {!report && !loading && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Selecione os filtros e clique em "Gerar Relatório"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
