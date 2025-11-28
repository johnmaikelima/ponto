import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Verificar se o usuário já aceitou o termo
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const acceptance = await prisma.termAcceptance.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ 
      hasAccepted: !!acceptance,
      acceptance: acceptance || null
    })
  } catch (error) {
    console.error("Erro ao verificar aceite do termo:", error)
    return NextResponse.json({ error: "Erro ao verificar aceite" }, { status: 500 })
  }
}

// Salvar aceite do termo com assinatura
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { signature } = body

    if (!signature) {
      return NextResponse.json({ error: "Assinatura é obrigatória" }, { status: 400 })
    }

    // Verificar se já aceitou
    const existing = await prisma.termAcceptance.findUnique({
      where: { userId: session.user.id },
    })

    if (existing) {
      return NextResponse.json({ error: "Termo já foi aceito anteriormente" }, { status: 400 })
    }

    // Obter IP e User Agent
    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Salvar aceite
    const acceptance = await prisma.termAcceptance.create({
      data: {
        userId: session.user.id,
        signature,
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.json({ 
      success: true,
      acceptance 
    }, { status: 201 })
  } catch (error) {
    console.error("Erro ao salvar aceite do termo:", error)
    return NextResponse.json({ error: "Erro ao salvar aceite" }, { status: 500 })
  }
}
