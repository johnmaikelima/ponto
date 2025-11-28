import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - Atualizar justificativa
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
    const { type, notes, attachment, fileName } = body

    const justification = await prisma.justification.update({
      where: { id: params.id },
      data: {
        type: type || undefined,
        notes: notes !== undefined ? notes : undefined,
        attachment: attachment !== undefined ? attachment : undefined,
        fileName: fileName !== undefined ? fileName : undefined,
      }
    })

    return NextResponse.json(justification)
  } catch (error) {
    console.error("Erro ao atualizar justificativa:", error)
    return NextResponse.json({ error: "Erro ao atualizar justificativa" }, { status: 500 })
  }
}

// DELETE - Remover justificativa
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    await prisma.justification.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Justificativa removida com sucesso" })
  } catch (error) {
    console.error("Erro ao remover justificativa:", error)
    return NextResponse.json({ error: "Erro ao remover justificativa" }, { status: 500 })
  }
}
