import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const employees = await prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
      },
      include: {
        company: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error("Erro ao buscar funcionários:", error)
    return NextResponse.json({ error: "Erro ao buscar funcionários" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, companyId } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "EMPLOYEE",
        companyId: companyId || null,
      },
      include: {
        company: true,
      },
    })

    // Remover senha da resposta
    const { password: _, ...employeeWithoutPassword } = employee

    return NextResponse.json(employeeWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar funcionário:", error)
    return NextResponse.json({ error: "Erro ao criar funcionário" }, { status: 500 })
  }
}
