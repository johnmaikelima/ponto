import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar resumo do mês (horas, faltas, justificativas)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const month = searchParams.get("month") // YYYY-MM

    if (!userId || !month) {
      return NextResponse.json(
        { error: "userId e month são obrigatórios" },
        { status: 400 }
      )
    }

    const [year, monthNum] = month.split("-")
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59)

    // Buscar todos os registros do mês
    const timeRecords = await prisma.timeRecord.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        project: {
          select: {
            name: true,
            trackingMode: true
          }
        }
      },
      orderBy: {
        timestamp: "asc"
      }
    })

    // Buscar justificativas do mês
    const justifications = await prisma.justification.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calcular estatísticas
    const dayRecords: Record<string, any[]> = {}
    
    timeRecords.forEach(record => {
      const date = new Date(record.timestamp)
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      
      if (!dayRecords[dayKey]) {
        dayRecords[dayKey] = []
      }
      dayRecords[dayKey].push(record)
    })

    // Calcular horas por dia e detalhes
    const dailyHours: Record<string, number> = {}
    const dailyDetails: Record<string, any[]> = {}
    let totalHours = 0

    Object.keys(dayRecords).forEach(dayKey => {
      const records = dayRecords[dayKey]
      let dayHours = 0
      const dayDetail: any[] = []

      // Agrupar por projeto
      const projectRecords: Record<string, any[]> = {}
      records.forEach(r => {
        if (!projectRecords[r.projectId]) {
          projectRecords[r.projectId] = []
        }
        projectRecords[r.projectId].push(r)
      })

      // Calcular horas por projeto
      Object.entries(projectRecords).forEach(([projectId, projRecords]) => {
        // Ordenar por timestamp
        projRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        
        // Calcular pares entrada/saída
        for (let i = 0; i < projRecords.length - 1; i += 2) {
          const entry = new Date(projRecords[i].timestamp)
          const exit = new Date(projRecords[i + 1]?.timestamp)
          
          if (exit) {
            const hours = (exit.getTime() - entry.getTime()) / (1000 * 60 * 60)
            dayHours += hours
            
            // Adicionar detalhe
            dayDetail.push({
              projectId,
              projectName: projRecords[i].project.name,
              entry: entry.toISOString(),
              exit: exit.toISOString(),
              hours
            })
          }
        }
      })

      dailyHours[dayKey] = dayHours
      dailyDetails[dayKey] = dayDetail
      totalHours += dayHours
    })

    // Contar dias trabalhados
    const workedDays = Object.keys(dayRecords).length

    // Contar dias úteis do mês (seg-sex)
    let businessDays = 0
    const current = new Date(startDate)
    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++
      }
      current.setDate(current.getDate() + 1)
    }

    // Contar faltas (dias úteis sem registro e sem justificativa)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let absences = 0
    const justificationDates = new Set(
      justifications.map(j => {
        const d = new Date(j.date)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })
    )

    const checkDate = new Date(startDate)
    while (checkDate <= endDate && checkDate < today) {
      const dayOfWeek = checkDate.getDay()
      const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
      
      // Se é dia útil, não trabalhou e não tem justificativa
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !dayRecords[dateKey] && !justificationDates.has(dateKey)) {
        absences++
      }
      
      checkDate.setDate(checkDate.getDate() + 1)
    }

    // Agrupar justificativas por tipo
    const justificationsByType: Record<string, number> = {}
    justifications.forEach(j => {
      justificationsByType[j.type] = (justificationsByType[j.type] || 0) + 1
    })

    return NextResponse.json({
      month,
      userId,
      totalHours: parseFloat(totalHours.toFixed(2)),
      workedDays,
      businessDays,
      absences,
      justifications: justifications.length,
      justificationsByType,
      averageHoursPerDay: workedDays > 0 ? parseFloat((totalHours / workedDays).toFixed(2)) : 0,
      dailyHours,
      dailyDetails,
      dayRecords,
      allJustifications: justifications
    })
  } catch (error) {
    console.error("Erro ao gerar resumo:", error)
    return NextResponse.json({ error: "Erro ao gerar resumo" }, { status: 500 })
  }
}
