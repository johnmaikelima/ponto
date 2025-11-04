import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
    const { name, email, password, companyId } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se o email já existe em outro usuário
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: params.id,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {
      name,
      email,
      companyId: companyId || null,
    }

    // Se uma nova senha foi fornecida, fazer o hash
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const employee = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: true,
      },
    })

    // Remover senha da resposta
    const { password: _, ...employeeWithoutPassword } = employee

    return NextResponse.json(employeeWithoutPassword)
  } catch (error) {
    console.error("Erro ao atualizar funcionário:", error)
    return NextResponse.json({ error: "Erro ao atualizar funcionário" }, { status: 500 })
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
    const employee = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            timeRecords: true,
          },
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })
    }

    if (employee._count.timeRecords > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir funcionário com registros de ponto vinculados" },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Funcionário excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir funcionário:", error)
    return NextResponse.json({ error: "Erro ao excluir funcionário" }, { status: 500 })
  }
}
