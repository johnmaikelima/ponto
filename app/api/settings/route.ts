import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Buscar configurações
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar primeira configuração (só deve ter uma)
    let settings = await prisma.systemSettings.findFirst()

    // Se não existir, criar com valores padrão
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: "Sistema de Ponto",
          primaryColor: "#3b82f6",
          secondaryColor: "#6366f1",
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 })
  }
}

// Atualizar configurações (apenas ADMIN)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      companyName,
      companyLogo,
      companyAddress,
      companyPhone,
      companyEmail,
      companyCnpj,
      primaryColor,
      secondaryColor,
    } = body

    // Buscar configuração existente
    let settings = await prisma.systemSettings.findFirst()

    if (settings) {
      // Atualizar existente
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          companyName: companyName || settings.companyName,
          companyLogo: companyLogo !== undefined ? companyLogo : settings.companyLogo,
          companyAddress: companyAddress !== undefined ? companyAddress : settings.companyAddress,
          companyPhone: companyPhone !== undefined ? companyPhone : settings.companyPhone,
          companyEmail: companyEmail !== undefined ? companyEmail : settings.companyEmail,
          companyCnpj: companyCnpj !== undefined ? companyCnpj : settings.companyCnpj,
          primaryColor: primaryColor || settings.primaryColor,
          secondaryColor: secondaryColor || settings.secondaryColor,
        },
      })
    } else {
      // Criar nova
      settings = await prisma.systemSettings.create({
        data: {
          companyName,
          companyLogo,
          companyAddress,
          companyPhone,
          companyEmail,
          companyCnpj,
          primaryColor: primaryColor || "#3b82f6",
          secondaryColor: secondaryColor || "#6366f1",
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 })
  }
}
