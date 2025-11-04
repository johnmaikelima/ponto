import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      include: {
        company: true,
        _count: {
          select: {
            timeRecords: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Erro ao buscar obras:", error)
    return NextResponse.json({ error: "Erro ao buscar obras" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, location, description, companyId, active, trackingMode } = body

    if (!name || !location || !companyId) {
      return NextResponse.json(
        { error: "Nome, localização e empresa são obrigatórios" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        location,
        description: description || null,
        companyId,
        active: active !== undefined ? active : true,
        trackingMode: trackingMode || "SIMPLE",
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar obra:", error)
    return NextResponse.json({ error: "Erro ao criar obra" }, { status: 500 })
  }
}
