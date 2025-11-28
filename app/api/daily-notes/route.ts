import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar anotação do dia para uma obra
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const dateStr = searchParams.get("date")

    if (!projectId) {
      return NextResponse.json({ error: "projectId é obrigatório" }, { status: 400 })
    }

    // Data de hoje (sem hora)
    const today = dateStr ? new Date(dateStr) : new Date()
    today.setHours(0, 0, 0, 0)

    const note = await prisma.dailyNote.findUnique({
      where: {
        userId_projectId_date: {
          userId: session.user.id,
          projectId,
          date: today
        }
      }
    })

    return NextResponse.json({ notes: note?.notes || "" })
  } catch (error) {
    console.error("Erro ao buscar anotação:", error)
    return NextResponse.json({ error: "Erro ao buscar anotação" }, { status: 500 })
  }
}

// POST - Salvar/atualizar anotação do dia
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, notes, date: dateStr } = body

    if (!projectId) {
      return NextResponse.json({ error: "projectId é obrigatório" }, { status: 400 })
    }

    // Data de hoje (sem hora)
    const today = dateStr ? new Date(dateStr) : new Date()
    today.setHours(0, 0, 0, 0)

    // Upsert (cria se não existe, atualiza se existe)
    const dailyNote = await prisma.dailyNote.upsert({
      where: {
        userId_projectId_date: {
          userId: session.user.id,
          projectId,
          date: today
        }
      },
      update: {
        notes: notes || ""
      },
      create: {
        userId: session.user.id,
        projectId,
        date: today,
        notes: notes || ""
      }
    })

    return NextResponse.json(dailyNote)
  } catch (error) {
    console.error("Erro ao salvar anotação:", error)
    return NextResponse.json({ error: "Erro ao salvar anotação" }, { status: 500 })
  }
}
