"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, FileText, Clock, AlertCircle, CheckCircle, Download } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import JustificationModal from "./JustificationModal"
import AttendanceReport from "./AttendanceReport"

interface AttendanceCalendarProps {
  employees: any[]
}

interface Justification {
  id: string
  date: Date
  type: string
  notes: string | null
  fileName: string | null
}

export default function AttendanceCalendar({ employees }: AttendanceCalendarProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [workedDays, setWorkedDays] = useState<Set<string>>(new Set())
  const [justifications, setJustifications] = useState<Justification[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [monthSummary, setMonthSummary] = useState<any>(null)
  const [showReport, setShowReport] = useState(false)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Buscar dados quando selecionar funcionário ou mudar mês
  useEffect(() => {
    if (selectedEmployee) {
      loadAttendanceData()
    }
  }, [selectedEmployee, currentMonth])

  const loadAttendanceData = async () => {
    setLoading(true)
    try {
      const month = format(currentMonth, "yyyy-MM")
      
      // Buscar dados de frequência
      const attendanceResponse = await fetch(`/api/attendance?userId=${selectedEmployee}&month=${month}`)
      if (attendanceResponse.ok) {
        const data = await attendanceResponse.json()
        setWorkedDays(new Set(data.workedDays))
        setJustifications(data.justifications.map((j: any) => ({
          ...j,
          date: new Date(j.date)
        })))
      }

      // Buscar resumo do mês
      const summaryResponse = await fetch(`/api/attendance/summary?userId=${selectedEmployee}&month=${month}`)
      if (summaryResponse.ok) {
        const summary = await summaryResponse.json()
        setMonthSummary(summary)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDayStatus = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    const justification = justifications.find(j => format(j.date, "yyyy-MM-dd") === dateKey)
    const hasWorked = workedDays.has(dateKey)
    const isWeekendDay = isWeekend(date)

    if (isWeekendDay) return { color: "bg-gray-100 text-gray-400", label: "Fim de semana", icon: "⚪" }
    if (justification) {
      return getJustificationColor(justification.type)
    }
    if (hasWorked) return { color: "bg-green-100 text-green-700 hover:bg-green-200", label: "Trabalhou", icon: "🟢" }
    
    // Só marca como falta se for dia útil passado
    if (date < new Date() && !isWeekendDay) {
      return { color: "bg-red-100 text-red-700 hover:bg-red-200", label: "Falta", icon: "🔴" }
    }
    
    return { color: "bg-white hover:bg-gray-50", label: "Sem registro", icon: "⚪" }
  }

  const getJustificationColor = (type: string) => {
    const colors: Record<string, any> = {
      MEDICAL_LEAVE: { color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200", label: "Atestado", icon: "🟡" },
      AUTHORIZED_LEAVE: { color: "bg-blue-100 text-blue-700 hover:bg-blue-200", label: "Autorizada", icon: "🔵" },
      TIME_BANK: { color: "bg-purple-100 text-purple-700 hover:bg-purple-200", label: "Banco de Horas", icon: "🟣" },
      UNJUSTIFIED: { color: "bg-orange-100 text-orange-700 hover:bg-orange-200", label: "Injustificada", icon: "🟠" },
      VACATION: { color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200", label: "Férias", icon: "🏖️" },
      COMPENSATORY: { color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200", label: "Compensatória", icon: "💼" },
    }
    return colors[type] || { color: "bg-gray-100", label: "Outro", icon: "⚪" }
  }

  const handleDayClick = (date: Date) => {
    if (!selectedEmployee) return
    setSelectedDate(date)
    setShowModal(true)
  }

  const handleJustificationSaved = () => {
    setShowModal(false)
    loadAttendanceData()
  }

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // Preencher dias vazios no início do mês
  const firstDayOfWeek = monthStart.getDay()
  const emptyDays = Array(firstDayOfWeek).fill(null)

  return (
    <div className="space-y-6">
      {/* Seleção de Funcionário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Gestão de Frequência
          </CardTitle>
          <CardDescription>
            Visualize dias trabalhados e adicione justificativas de faltas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="employee">Selecione o Funcionário</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Escolha um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Mês */}
      {selectedEmployee && monthSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Horas</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                {monthSummary.totalHours}h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                Média: {monthSummary.averageHoursPerDay}h/dia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Dias Trabalhados</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                {monthSummary.workedDays}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                De {monthSummary.businessDays} dias úteis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Faltas</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                {monthSummary.absences}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                Sem justificativa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Justificativas</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <FileText className="w-6 h-6 text-yellow-600" />
                {monthSummary.justifications}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                Faltas justificadas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botão de Relatório */}
      {selectedEmployee && monthSummary && (
        <div className="flex justify-end">
          <Button onClick={() => setShowReport(true)} className="gap-2">
            <FileText className="w-4 h-4" />
            Ver Relatório Detalhado
          </Button>
        </div>
      )}

      {/* Calendário */}
      {selectedEmployee && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Carregando...</div>
            ) : (
              <>
                {/* Calendário Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Cabeçalho dos dias da semana */}
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                      {day}
                    </div>
                  ))}

                  {/* Dias vazios no início */}
                  {emptyDays.map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}

                  {/* Dias do mês */}
                  {daysInMonth.map((date) => {
                    const status = getDayStatus(date)
                    const dateKey = format(date, "yyyy-MM-dd")
                    const justification = justifications.find(j => format(j.date, "yyyy-MM-dd") === dateKey)

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDayClick(date)}
                        className={`aspect-square rounded-lg border-2 transition-all ${status.color} ${
                          isSameMonth(date, currentMonth) ? "" : "opacity-50"
                        } flex flex-col items-center justify-center p-1 relative group`}
                        title={status.label}
                      >
                        <span className="text-lg font-medium">{format(date, "d")}</span>
                        <span className="text-xl">{status.icon}</span>
                        {justification && (
                          <FileText className="w-3 h-3 absolute top-1 right-1 text-gray-600" />
                        )}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {status.label}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Legenda */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium mb-3">Legenda:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟢</span>
                      <span>Trabalhou</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔴</span>
                      <span>Falta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟡</span>
                      <span>Atestado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔵</span>
                      <span>Autorizada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟣</span>
                      <span>Banco de Horas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟠</span>
                      <span>Injustificada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏖️</span>
                      <span>Férias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚪</span>
                      <span>Fim de semana</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Justificativa */}
      {showModal && selectedDate && selectedEmployee && (
        <JustificationModal
          open={showModal}
          onClose={() => setShowModal(false)}
          date={selectedDate}
          userId={selectedEmployee}
          existingJustification={justifications.find(
            j => format(j.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
          )}
          onSaved={handleJustificationSaved}
        />
      )}

      {/* Modal de Relatório */}
      {showReport && monthSummary && selectedEmployee && (
        <AttendanceReport
          open={showReport}
          onClose={() => setShowReport(false)}
          summary={monthSummary}
          employee={employees.find(e => e.id === selectedEmployee)}
          month={currentMonth}
        />
      )}
    </div>
  )
}
