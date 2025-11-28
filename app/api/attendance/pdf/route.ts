import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const JUSTIFICATION_LABELS: Record<string, string> = {
  MEDICAL_LEAVE: "Atestado Médico",
  AUTHORIZED_LEAVE: "Autorizada (Diretoria)",
  TIME_BANK: "Banco de Horas",
  UNJUSTIFIED: "Injustificada",
  VACATION: "Férias",
  COMPENSATORY: "Compensatória",
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const month = searchParams.get("month") // YYYY-MM

    if (!userId || !month) {
      return NextResponse.json(
        { error: "userId e month são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar dados do funcionário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })
    }

    // Buscar configurações do sistema
    const systemSettings = await prisma.systemSettings.findFirst()

    // Buscar resumo
    const [year, monthNum] = month.split("-")
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59)

    const timeRecords = await prisma.timeRecord.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        project: {
          select: {
            name: true,
            trackingMode: true
          }
        }
      },
      orderBy: {
        timestamp: "asc"
      }
    })

    const justifications = await prisma.justification.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calcular estatísticas (mesmo código da API summary)
    const dayRecords: Record<string, any[]> = {}
    
    timeRecords.forEach(record => {
      const date = new Date(record.timestamp)
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      
      if (!dayRecords[dayKey]) {
        dayRecords[dayKey] = []
      }
      dayRecords[dayKey].push(record)
    })

    const dailyHours: Record<string, number> = {}
    const dailyDetails: Record<string, any[]> = {}
    let totalHours = 0

    Object.keys(dayRecords).forEach(dayKey => {
      const records = dayRecords[dayKey]
      let dayHours = 0
      const dayDetail: any[] = []

      const projectRecords: Record<string, any[]> = {}
      records.forEach(r => {
        if (!projectRecords[r.projectId]) {
          projectRecords[r.projectId] = []
        }
        projectRecords[r.projectId].push(r)
      })

      Object.entries(projectRecords).forEach(([projectId, projRecords]) => {
        projRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        
        for (let i = 0; i < projRecords.length - 1; i += 2) {
          const entry = new Date(projRecords[i].timestamp)
          const exit = new Date(projRecords[i + 1]?.timestamp)
          
          if (exit) {
            const hours = (exit.getTime() - entry.getTime()) / (1000 * 60 * 60)
            dayHours += hours
            
            dayDetail.push({
              projectName: projRecords[i].project.name,
              entry,
              exit,
              hours
            })
          }
        }
      })

      dailyHours[dayKey] = dayHours
      dailyDetails[dayKey] = dayDetail
      totalHours += dayHours
    })

    const workedDays = Object.keys(dayRecords).length

    // Criar PDF
    const doc = new jsPDF()
    
    // Cabeçalho com dados da empresa do sistema
    if (systemSettings) {
      doc.setFontSize(16)
      doc.text(systemSettings.companyName || "Sistema de Ponto", 105, 15, { align: "center" })
      doc.setFontSize(10)
      if (systemSettings.companyAddress) {
        doc.text(systemSettings.companyAddress, 105, 22, { align: "center" })
      }
      if (systemSettings.companyPhone) {
        doc.text(`Tel: ${systemSettings.companyPhone}`, 105, 28, { align: "center" })
      }
    }
    
    doc.setFontSize(14)
    doc.text("RELATÓRIO DE FREQUÊNCIA", 105, 40, { align: "center" })
    
    doc.setFontSize(11)
    doc.text(`Funcionário: ${user.name}`, 20, 52)
    doc.text(`Período: ${format(startDate, "MMMM 'de' yyyy", { locale: ptBR })}`, 20, 59)

    // Resumo
    doc.setFontSize(14)
    doc.text("Resumo do Período", 20, 62)
    
    doc.setFontSize(10)
    doc.text(`Total de Horas: ${totalHours.toFixed(2)}h`, 20, 70)
    doc.text(`Dias Trabalhados: ${workedDays}`, 20, 77)
    doc.text(`Média por Dia: ${workedDays > 0 ? (totalHours / workedDays).toFixed(2) : 0}h`, 20, 84)
    doc.text(`Justificativas: ${justifications.length}`, 20, 91)

    // Preparar dados da tabela
    const tableData: any[] = []
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, day)
      const dateKey = format(date, "yyyy-MM-dd")
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      const details = dailyDetails[dateKey] || []
      const justification = justifications.find(j => 
        format(new Date(j.date), "yyyy-MM-dd") === dateKey
      )

      // Se tem registros de trabalho
      if (details.length > 0) {
        details.forEach((detail: any, index: number) => {
          tableData.push([
            index === 0 ? format(date, "dd/MM/yyyy") : "",
            index === 0 ? format(date, "EEE", { locale: ptBR }) : "",
            detail.projectName,
            format(detail.entry, "HH:mm"),
            format(detail.exit, "HH:mm"),
            `${detail.hours.toFixed(2)}h`,
            index === 0 ? "Trabalhou" : ""
          ])
        })
      } else if (justification) {
        // Se tem justificativa
        tableData.push([
          format(date, "dd/MM/yyyy"),
          format(date, "EEE", { locale: ptBR }),
          "-",
          "-",
          "-",
          "-",
          JUSTIFICATION_LABELS[justification.type]
        ])
      } else if (isWeekend) {
        // Fim de semana
        tableData.push([
          format(date, "dd/MM/yyyy"),
          format(date, "EEE", { locale: ptBR }),
          "-",
          "-",
          "-",
          "-",
          "Fim de semana"
        ])
      } else {
        // Falta
        tableData.push([
          format(date, "dd/MM/yyyy"),
          format(date, "EEE", { locale: ptBR }),
          "-",
          "-",
          "-",
          "-",
          "Falta"
        ])
      }
    }

    // Tabela
    autoTable(doc, {
      startY: 100,
      head: [["Data", "Dia", "Obra", "Entrada", "Saída", "Horas", "Status"]],
      body: tableData,
      foot: [[
        "TOTAL",
        "",
        "",
        "",
        "",
        `${totalHours.toFixed(2)}h`,
        `${workedDays} dias`
      ]],
      theme: "grid",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8
      },
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: 0,
        fontStyle: "bold"
      },
      styles: {
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 18 },
        2: { cellWidth: 40, fontSize: 7 },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 18, halign: "center" },
        6: { cellWidth: 'auto', fontSize: 7 }
      }
    })

    // Rodapé
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Página ${i} de ${pageCount} - Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
        105,
        285,
        { align: "center" }
      )
    }

    // Gerar buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-frequencia-${user.name}-${month}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 })
  }
}
