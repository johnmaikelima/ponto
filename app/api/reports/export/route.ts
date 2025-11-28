import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const projectId = searchParams.get("projectId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Buscar registros (mesma lógica da API de relatórios)
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (projectId) {
      where.projectId = projectId
    } else if (companyId) {
      where.project = {
        companyId: companyId
      }
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.timestamp.lte = end
      }
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    })

    // Agrupar por funcionário e calcular horas
    const employeeHours: any = {}

    records.forEach((record) => {
      const key = `${record.userId}-${record.projectId}`
      
      if (!employeeHours[key]) {
        employeeHours[key] = {
          userId: record.userId,
          userName: record.user.name,
          userEmail: record.user.email,
          projectId: record.projectId,
          projectName: record.project.name,
          companyId: record.project.companyId,
          companyName: record.project.company.name,
          days: {},
          totalHours: 0,
          totalDays: 0,
        }
      }

      const dateKey = new Date(record.timestamp).toISOString().split("T")[0]

      if (!employeeHours[key].days[dateKey]) {
        employeeHours[key].days[dateKey] = {
          date: dateKey,
          entry: null,
          exit: null,
          hours: 0,
        }
      }

      if (record.type === "ENTRY") {
        employeeHours[key].days[dateKey].entry = record.timestamp
      } else if (record.type === "EXIT") {
        employeeHours[key].days[dateKey].exit = record.timestamp
      }
    })

    // Calcular horas
    Object.keys(employeeHours).forEach((key) => {
      const employee = employeeHours[key]
      let totalMinutes = 0
      let daysWorked = 0

      Object.keys(employee.days).forEach((dateKey) => {
        const day = employee.days[dateKey]
        
        if (day.entry && day.exit) {
          const entryTime = new Date(day.entry).getTime()
          const exitTime = new Date(day.exit).getTime()
          const minutes = (exitTime - entryTime) / (1000 * 60)
          
          day.hours = minutes / 60
          totalMinutes += minutes
          daysWorked++
        }
      })

      employee.totalHours = totalMinutes / 60
      employee.totalDays = daysWorked
      employee.daysArray = Object.values(employee.days)
    })

    const report = Object.values(employeeHours)

    // Criar Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Relatório de Horas")

    // Buscar configurações da empresa
    const settings = await prisma.systemSettings.findFirst()

    // Cabeçalho com logo e informações
    if (settings?.companyName) {
      worksheet.mergeCells("A1:F1")
      const titleRow = worksheet.getCell("A1")
      titleRow.value = settings.companyName
      titleRow.font = { size: 16, bold: true }
      titleRow.alignment = { horizontal: "center", vertical: "middle" }
      
      if (settings.companyCnpj || settings.companyAddress) {
        worksheet.mergeCells("A2:F2")
        const infoRow = worksheet.getCell("A2")
        const info = []
        if (settings.companyCnpj) info.push(`CNPJ: ${settings.companyCnpj}`)
        if (settings.companyAddress) info.push(settings.companyAddress)
        infoRow.value = info.join(" - ")
        infoRow.font = { size: 10 }
        infoRow.alignment = { horizontal: "center" }
      }

      worksheet.addRow([])
    }

    // Título do relatório
    worksheet.mergeCells(`A${worksheet.rowCount + 1}:F${worksheet.rowCount + 1}`)
    const reportTitle = worksheet.getCell(`A${worksheet.rowCount}`)
    reportTitle.value = "RELATÓRIO DE HORAS TRABALHADAS"
    reportTitle.font = { size: 14, bold: true }
    reportTitle.alignment = { horizontal: "center" }

    // Período
    if (startDate || endDate) {
      worksheet.mergeCells(`A${worksheet.rowCount + 1}:F${worksheet.rowCount + 1}`)
      const periodRow = worksheet.getCell(`A${worksheet.rowCount}`)
      const period = []
      if (startDate) period.push(`De: ${new Date(startDate).toLocaleDateString("pt-BR")}`)
      if (endDate) period.push(`Até: ${new Date(endDate).toLocaleDateString("pt-BR")}`)
      periodRow.value = period.join(" ")
      periodRow.font = { size: 10 }
      periodRow.alignment = { horizontal: "center" }
    }

    worksheet.addRow([])

    // Cabeçalho da tabela
    const headerRow = worksheet.addRow([
      "Funcionário",
      "Email",
      "Obra",
      "Empresa",
      "Dias Trabalhados",
      "Total de Horas",
      "Média por Dia"
    ])
    
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    }

    // Dados
    let totalDays = 0
    let totalHours = 0

    report.forEach((item: any) => {
      const avgHours = item.totalDays > 0 ? item.totalHours / item.totalDays : 0
      
      worksheet.addRow([
        item.userName,
        item.userEmail,
        item.projectName,
        item.companyName,
        item.totalDays,
        parseFloat(item.totalHours.toFixed(2)),
        parseFloat(avgHours.toFixed(2))
      ])

      totalDays += item.totalDays
      totalHours += item.totalHours
    })

    // Linha de total
    const totalRow = worksheet.addRow([
      "TOTAL GERAL",
      "",
      "",
      "",
      totalDays,
      parseFloat(totalHours.toFixed(2)),
      totalDays > 0 ? parseFloat((totalHours / totalDays).toFixed(2)) : 0
    ])
    
    totalRow.font = { bold: true }
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFD700" }
    }

    // Ajustar largura das colunas
    worksheet.columns = [
      { width: 25 },
      { width: 30 },
      { width: 25 },
      { width: 25 },
      { width: 18 },
      { width: 18 },
      { width: 18 }
    ]

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="relatorio-horas-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Erro ao exportar relatório:", error)
    return NextResponse.json({ error: "Erro ao exportar relatório" }, { status: 500 })
  }
}
