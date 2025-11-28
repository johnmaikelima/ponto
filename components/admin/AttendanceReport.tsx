"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AttendanceReportProps {
  open: boolean
  onClose: () => void
  summary: any
  employee: any
  month: Date
}

const JUSTIFICATION_LABELS: Record<string, string> = {
  MEDICAL_LEAVE: "Atestado Médico",
  AUTHORIZED_LEAVE: "Autorizada (Diretoria)",
  TIME_BANK: "Banco de Horas",
  UNJUSTIFIED: "Injustificada",
  VACATION: "Férias",
  COMPENSATORY: "Compensatória",
}

export default function AttendanceReport({ open, onClose, summary, employee, month }: AttendanceReportProps) {
  
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/attendance/pdf?userId=${employee.id}&month=${format(month, "yyyy-MM")}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `relatorio-frequencia-${employee.name}-${format(month, "yyyy-MM")}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    }
  }

  // Organizar dados por dia
  const dailyData: any[] = []
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    const dateKey = format(date, "yyyy-MM-dd")
    const dayOfWeek = date.getDay()

    const hours = summary.dailyHours[dateKey] || 0
    const details = summary.dailyDetails?.[dateKey] || []
    const justification = summary.allJustifications?.find((j: any) => 
      format(new Date(j.date), "yyyy-MM-dd") === dateKey
    )
    const hasRecords = summary.dayRecords[dateKey]?.length > 0
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Determinar status
    let status = "absent"
    if (justification) {
      status = "justified"
    } else if (hasRecords) {
      status = "worked"
    } else if (isWeekend) {
      status = "weekend"
    }

    dailyData.push({
      date,
      dateKey,
      hours,
      details,
      justification,
      hasRecords,
      isWeekend,
      status
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório de Frequência</DialogTitle>
          <DialogDescription>
            {employee?.name} - {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 print:space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2">
            <div className="bg-blue-50 p-4 rounded-lg print:p-2">
              <p className="text-sm text-gray-600">Total de Horas</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalHours}h</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg print:p-2">
              <p className="text-sm text-gray-600">Dias Trabalhados</p>
              <p className="text-2xl font-bold text-green-600">{summary.workedDays}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg print:p-2">
              <p className="text-sm text-gray-600">Faltas</p>
              <p className="text-2xl font-bold text-red-600">{summary.absences}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg print:p-2">
              <p className="text-sm text-gray-600">Justificativas</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.justifications}</p>
            </div>
          </div>

          {/* Tabela Detalhada */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-left p-3 font-medium">Dia</th>
                  <th className="text-left p-3 font-medium">Obra</th>
                  <th className="text-center p-3 font-medium">Entrada</th>
                  <th className="text-center p-3 font-medium">Saída</th>
                  <th className="text-center p-3 font-medium">Horas</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((day, index) => {
                  // Se tem múltiplos registros (múltiplas obras), mostrar cada um
                  if (day.details.length > 0) {
                    return day.details.map((detail: any, detailIndex: number) => (
                      <tr key={`${day.dateKey}-${detailIndex}`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        {detailIndex === 0 && (
                          <>
                            <td className="p-3" rowSpan={day.details.length}>{format(day.date, "dd/MM/yyyy")}</td>
                            <td className="p-3" rowSpan={day.details.length}>{format(day.date, "EEEE", { locale: ptBR })}</td>
                          </>
                        )}
                        <td className="p-3 text-xs">{detail.projectName}</td>
                        <td className="p-3 text-center">{format(new Date(detail.entry), "HH:mm")}</td>
                        <td className="p-3 text-center">{format(new Date(detail.exit), "HH:mm")}</td>
                        <td className="p-3 text-center font-medium">{detail.hours.toFixed(2)}h</td>
                        {detailIndex === 0 && (
                          <td className="p-3" rowSpan={day.details.length}>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Trabalhou
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  }
                  
                  // Se não tem registros (falta, justificativa ou fim de semana)
                  return (
                    <tr key={day.dateKey} className={day.isWeekend ? "bg-gray-100" : (index % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                      <td className="p-3">{format(day.date, "dd/MM/yyyy")}</td>
                      <td className="p-3">{format(day.date, "EEEE", { locale: ptBR })}</td>
                      <td className="p-3 text-gray-400">-</td>
                      <td className="p-3 text-center text-gray-400">-</td>
                      <td className="p-3 text-center text-gray-400">-</td>
                      <td className="p-3 text-center text-gray-400">-</td>
                      <td className="p-3">
                        {day.status === "justified" && day.justification && (
                          <div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              📋 {JUSTIFICATION_LABELS[day.justification.type]}
                            </span>
                            {day.justification.notes && (
                              <p className="text-xs text-gray-500 mt-1">{day.justification.notes}</p>
                            )}
                          </div>
                        )}
                        {day.status === "weekend" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                            📅 Fim de semana
                          </span>
                        )}
                        {day.status === "absent" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            ✗ Falta
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-medium">
                <tr>
                  <td colSpan={5} className="p-3">TOTAL</td>
                  <td className="p-3 text-center">{summary.totalHours}h</td>
                  <td className="p-3">
                    {summary.workedDays} dias trabalhados
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Justificativas por Tipo */}
          {summary.justifications > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Resumo de Justificativas</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(summary.justificationsByType).map(([type, count]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{JUSTIFICATION_LABELS[type]}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 justify-end print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
