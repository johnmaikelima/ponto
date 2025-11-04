"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, MapPin, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface RecordsTableProps {
  records: any[]
  showFilters?: boolean
}

export default function RecordsTable({ records, showFilters }: RecordsTableProps) {
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  // Extrair lista única de funcionários e obras
  const employees = useMemo(() => {
    const uniqueEmployees = new Map()
    records.forEach(record => {
      if (!uniqueEmployees.has(record.user.id)) {
        uniqueEmployees.set(record.user.id, record.user)
      }
    })
    return Array.from(uniqueEmployees.values())
  }, [records])

  const projects = useMemo(() => {
    const uniqueProjects = new Map()
    records.forEach(record => {
      if (!uniqueProjects.has(record.project.id)) {
        uniqueProjects.set(record.project.id, record.project)
      }
    })
    return Array.from(uniqueProjects.values())
  }, [records])

  // Filtrar registros
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Filtro por funcionário
      if (employeeFilter !== "all" && record.user.id !== employeeFilter) {
        return false
      }

      // Filtro por obra
      if (projectFilter !== "all" && record.project.id !== projectFilter) {
        return false
      }

      // Filtro por tipo
      if (typeFilter !== "all" && record.type !== typeFilter) {
        return false
      }

      // Filtro por data
      if (dateFilter) {
        const recordDate = format(new Date(record.timestamp), "yyyy-MM-dd")
        if (recordDate !== dateFilter) {
          return false
        }
      }

      return true
    })
  }, [records, employeeFilter, projectFilter, dateFilter, typeFilter])

  const clearFilters = () => {
    setEmployeeFilter("all")
    setProjectFilter("all")
    setDateFilter("")
    setTypeFilter("all")
  }

  const hasActiveFilters = employeeFilter !== "all" || projectFilter !== "all" || dateFilter !== "" || typeFilter !== "all"

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-sm">Filtros</h3>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee-filter">Funcionário</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger id="employee-filter">
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

            <div className="space-y-2">
              <Label htmlFor="project-filter">Obra</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger id="project-filter">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="ENTRY">Entrada</SelectItem>
                  <SelectItem value="EXIT">Saída</SelectItem>
                  <SelectItem value="HOTEL_DEPARTURE">Saída do Hotel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter">Data</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{filteredRecords.length}</span> de <span className="font-semibold">{records.length}</span> registros
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 text-sm font-medium">Funcionário</th>
              <th className="text-left p-3 text-sm font-medium">Obra</th>
              <th className="text-left p-3 text-sm font-medium">Tipo</th>
              <th className="text-left p-3 text-sm font-medium">Data/Hora</th>
              <th className="text-left p-3 text-sm font-medium">Localização</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Nenhum registro encontrado com os filtros aplicados
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
              <tr key={record.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm">{record.user.name}</td>
                <td className="p-3 text-sm">
                  <div>{record.project.name}</div>
                  <div className="text-xs text-gray-500">{record.project.company.name}</div>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    record.type === "ENTRY" 
                      ? "bg-green-100 text-green-700" 
                      : record.type === "EXIT"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {record.type === "ENTRY" ? "Entrada" : record.type === "EXIT" ? "Saída" : "Saída do Hotel"}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  {format(new Date(record.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </td>
                <td className="p-3 text-sm">
                  {record.latitude && record.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Ver mapa
                    </a>
                  ) : (
                    <span className="text-gray-400">Não disponível</span>
                  )}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
