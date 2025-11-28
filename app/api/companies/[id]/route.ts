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
    const { name, cnpj } = body

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        name,
        cnpj: cnpj || null,
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error)
    return NextResponse.json({ error: "Erro ao atualizar empresa" }, { status: 500 })
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

    // Verificar se há funcionários ou obras vinculados
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            employees: true,
            projects: true,
          },
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }

    if (company._count.employees > 0 || company._count.projects > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir empresa com funcionários ou obras vinculados" },
        { status: 400 }
      )
    }

    await prisma.company.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Empresa excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir empresa:", error)
    return NextResponse.json({ error: "Erro ao excluir empresa" }, { status: 500 })
  }
}
