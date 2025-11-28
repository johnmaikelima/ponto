import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar justificativas de um funcionário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const month = searchParams.get("month") // YYYY-MM
    const year = searchParams.get("year")

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    let whereClause: any = { userId }

    // Filtrar por mês/ano se fornecido
    if (month) {
      const [y, m] = month.split("-")
      const startDate = new Date(parseInt(y), parseInt(m) - 1, 1)
      const endDate = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59)
      
      whereClause.date = {
        gte: startDate,
        lte: endDate
      }
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1)
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59)
      
      whereClause.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const justifications = await prisma.justification.findMany({
      where: whereClause,
      orderBy: {
        date: "desc"
      }
    })

    return NextResponse.json(justifications)
  } catch (error) {
    console.error("Erro ao buscar justificativas:", error)
    return NextResponse.json({ error: "Erro ao buscar justificativas" }, { status: 500 })
  }
}

// POST - Criar nova justificativa
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, date, type, notes, attachment, fileName } = body

    if (!userId || !date || !type) {
      return NextResponse.json(
        { error: "userId, date e type são obrigatórios" },
        { status: 400 }
      )
    }

    // Converter data para DateTime sem hora
    const justificationDate = new Date(date)
    justificationDate.setHours(0, 0, 0, 0)

    // Verificar se já existe justificativa para este dia
    const existing = await prisma.justification.findUnique({
      where: {
        userId_date: {
          userId,
          date: justificationDate
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma justificativa para este dia" },
        { status: 400 }
      )
    }

    const justification = await prisma.justification.create({
      data: {
        userId,
        date: justificationDate,
        type,
        notes: notes || null,
        attachment: attachment || null,
        fileName: fileName || null,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(justification)
  } catch (error) {
    console.error("Erro ao criar justificativa:", error)
    return NextResponse.json({ error: "Erro ao criar justificativa" }, { status: 500 })
  }
}
