import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, type, latitude, longitude, notes } = body

    if (!projectId || !type) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }

    const timeRecord = await prisma.timeRecord.create({
      data: {
        userId: session.user.id,
        projectId,
        type,
        latitude,
        longitude,
        notes,
      },
      include: {
        project: {
          include: {
            company: true,
          },
        },
      },
    })

    return NextResponse.json(timeRecord)
  } catch (error) {
    console.error("Erro ao criar registro:", error)
    return NextResponse.json(
      { error: "Erro ao criar registro" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const projectId = searchParams.get("projectId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (session.user.role === "EMPLOYEE") {
      where.userId = session.user.id
    } else if (userId) {
      where.userId = userId
    }

    if (projectId) {
      where.projectId = projectId
    }

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
        timestamp: "desc",
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Erro ao buscar registros:", error)
    return NextResponse.json(
      { error: "Erro ao buscar registros" },
      { status: 500 }
    )
  }
}
