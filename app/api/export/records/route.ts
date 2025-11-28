import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        user: {
          select: {
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
        timestamp: "desc",
      },
    })

    // Preparar dados para Excel
    const data = records.map((record) => ({
      "Funcionário": record.user.name,
      "Email": record.user.email,
      "Empresa": record.project.company.name,
      "Obra": record.project.name,
      "Localização": record.project.location,
      "Tipo": record.type === "ENTRY" ? "Entrada" : "Saída",
      "Data": format(new Date(record.timestamp), "dd/MM/yyyy", { locale: ptBR }),
      "Hora": format(new Date(record.timestamp), "HH:mm:ss", { locale: ptBR }),
      "Latitude": record.latitude || "N/A",
      "Longitude": record.longitude || "N/A",
      "Observações": record.notes || "",
    }))

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 25 }, // Funcionário
      { wch: 30 }, // Email
      { wch: 25 }, // Empresa
      { wch: 30 }, // Obra
      { wch: 35 }, // Localização
      { wch: 10 }, // Tipo
      { wch: 12 }, // Data
      { wch: 10 }, // Hora
      { wch: 12 }, // Latitude
      { wch: 12 }, // Longitude
      { wch: 30 }, // Observações
    ]
    ws["!cols"] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, "Registros de Ponto")

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    // Retornar arquivo
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=registros-ponto-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
      },
    })
  } catch (error) {
    console.error("Erro ao exportar registros:", error)
    return NextResponse.json(
      { error: "Erro ao exportar registros" },
      { status: 500 }
    )
  }
}
