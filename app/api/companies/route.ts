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

    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            employees: true,
            projects: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error("Erro ao buscar empresas:", error)
    return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const company = await prisma.company.create({
      data: {
        name,
        cnpj: cnpj || null,
      },
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar empresa:", error)
    return NextResponse.json({ error: "Erro ao criar empresa" }, { status: 500 })
  }
}
