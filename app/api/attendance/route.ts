import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar dias trabalhados e justificativas de um funcionário
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

    const [year, monthNum] = month.split("-")
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59)

    // Buscar registros de ponto do mês
    const timeRecords = await prisma.timeRecord.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        timestamp: true,
        type: true
      },
      orderBy: {
        timestamp: "asc"
      }
    })

    // Buscar justificativas do mês
    const justifications = await prisma.justification.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Agrupar registros por dia
    const workedDays = new Set<string>()
    timeRecords.forEach(record => {
      const date = new Date(record.timestamp)
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      workedDays.add(dayKey)
    })

    return NextResponse.json({
      workedDays: Array.from(workedDays),
      justifications,
      month,
      userId
    })
  } catch (error) {
    console.error("Erro ao buscar frequência:", error)
    return NextResponse.json({ error: "Erro ao buscar frequência" }, { status: 500 })
  }
}
