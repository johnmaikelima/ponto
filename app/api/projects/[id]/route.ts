import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const project = await prisma.project.update({
      where: { id: params.id },
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

    return NextResponse.json(project)
  } catch (error) {
    console.error("Erro ao atualizar obra:", error)
    return NextResponse.json({ error: "Erro ao atualizar obra" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se há registros de ponto vinculados
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            timeRecords: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 })
    }

    if (project._count.timeRecords > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir obra com registros de ponto vinculados" },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Obra excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir obra:", error)
    return NextResponse.json({ error: "Erro ao excluir obra" }, { status: 500 })
  }
}
