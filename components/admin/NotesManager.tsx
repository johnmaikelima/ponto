"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileText, Calendar, User, Building2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Note {
  id: string
  date: Date
  notes: string
  user: {
    id: string
    name: string
    email: string
  }
  project: {
    id: string
    name: string
    location: string
    company: {
      name: string
    }
  }
}

interface NotesManagerProps {
  initialNotes: Note[]
  projects: any[]
  employees: any[]
}

export default function NotesManager({ initialNotes, projects, employees }: NotesManagerProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(initialNotes)
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...notes]

    // Filtro por obra
    if (selectedProject !== "all") {
      filtered = filtered.filter(note => note.project.id === selectedProject)
    }

    // Filtro por funcionário
    if (selectedEmployee !== "all") {
      filtered = filtered.filter(note => note.user.id === selectedEmployee)
    }

    // Filtro por data inicial
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      filtered = filtered.filter(note => new Date(note.date) >= start)
    }

    // Filtro por data final
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(note => new Date(note.date) <= end)
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredNotes(filtered)
  }, [notes, selectedProject, selectedEmployee, startDate, endDate])

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as anotações por obra, funcionário ou período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="project">Obra</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Todas as obras" />
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
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Todos os funcionários" />
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
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Anotações */}
      <Card>
        <CardHeader>
          <CardTitle>Anotações dos Funcionários</CardTitle>
          <CardDescription>
            {filteredNotes.length} {filteredNotes.length === 1 ? "anotação encontrada" : "anotações encontradas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">Nenhuma anotação encontrada</p>
              <p className="text-sm text-gray-400 mt-1">
                Tente ajustar os filtros ou aguarde os funcionários adicionarem observações
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Cabeçalho da Anotação */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm">
                          {format(new Date(note.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{note.user.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{note.project.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{note.project.company.name}</p>
                    </div>
                  </div>

                  {/* Conteúdo da Anotação */}
                  <div className="bg-gray-50 rounded p-3 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
