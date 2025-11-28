import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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
    })

    const report = Object.values(employeeHours).sort((a: any, b: any) => {
      return a.userName.localeCompare(b.userName)
    })

    // Buscar configurações da empresa
    const settings = await prisma.systemSettings.findFirst()

    // Calcular totais
    const totalEmployees = new Set(report.map((r: any) => r.userId)).size
    const totalProjects = new Set(report.map((r: any) => r.projectId)).size
    const totalHours = report.reduce((sum: number, r: any) => sum + r.totalHours, 0)
    const totalDays = report.reduce((sum: number, r: any) => sum + r.totalDays, 0)

    // Criar PDF com jsPDF
    const doc = new jsPDF()
    let yPos = 20

    // Logo (se existir)
    if (settings?.companyLogo && settings.companyLogo.startsWith("data:image")) {
      try {
        doc.addImage(settings.companyLogo, "PNG", 15, yPos, 30, 30)
        yPos += 35
      } catch (error) {
        console.error("Erro ao adicionar logo:", error)
      }
    }

    // Nome da Empresa
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text(settings?.companyName || "Sistema de Ponto", 15, yPos)
    yPos += 8

    // Informações da Empresa
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    if (settings?.companyCnpj) {
      doc.text(`CNPJ: ${settings.companyCnpj}`, 15, yPos)
      yPos += 5
    }
    if (settings?.companyAddress) {
      doc.text(settings.companyAddress, 15, yPos)
      yPos += 5
    }
    const contactInfo = []
    if (settings?.companyPhone) contactInfo.push(`Tel: ${settings.companyPhone}`)
    if (settings?.companyEmail) contactInfo.push(`Email: ${settings.companyEmail}`)
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(" | "), 15, yPos)
      yPos += 8
    }

    // Linha separadora
    doc.line(15, yPos, 195, yPos)
    yPos += 8

    // Título do Relatório
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("RELATÓRIO DE HORAS TRABALHADAS", 105, yPos, { align: "center" })
    yPos += 8

    // Período
    if (startDate || endDate) {
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      const period = []
      if (startDate) period.push(`De: ${new Date(startDate).toLocaleDateString("pt-BR")}`)
      if (endDate) period.push(`Até: ${new Date(endDate).toLocaleDateString("pt-BR")}`)
      doc.text(period.join(" "), 105, yPos, { align: "center" })
      yPos += 5
    }

    // Data de geração
    doc.setFontSize(8)
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 105, yPos, { align: "center" })
    yPos += 10

    // Resumo
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("RESUMO GERAL", 15, yPos)
    yPos += 6
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Funcionários: ${totalEmployees}  |  Obras: ${totalProjects}  |  Total de Horas: ${totalHours.toFixed(2)}h`, 15, yPos)
    yPos += 10

    // Tabela com autoTable
    const tableData = report.map((item: any) => [
      item.userName,
      item.projectName,
      item.companyName,
      item.totalDays.toString(),
      item.totalHours.toFixed(2) + "h",
      (item.totalDays > 0 ? (item.totalHours / item.totalDays).toFixed(2) : "0.00") + "h"
    ])

    // Adicionar linha de total
    const avgTotal = totalDays > 0 ? totalHours / totalDays : 0
    tableData.push([
      "TOTAL GERAL",
      "",
      "",
      totalDays.toString(),
      totalHours.toFixed(2) + "h",
      avgTotal.toFixed(2) + "h"
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Funcionário", "Obra", "Empresa", "Dias", "Total Horas", "Média/Dia"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" }
      },
      didDrawPage: (data: any) => {
        // Rodapé
        const pageCount = doc.getNumberOfPages()
        const pageCurrent = doc.getCurrentPageInfo().pageNumber
        doc.setFontSize(8)
        doc.text(
          `Página ${pageCurrent} de ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        )
      }
    })

    // Gerar PDF como blob
    const pdfBlob = doc.output("blob")
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-horas-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 })
  }
}
