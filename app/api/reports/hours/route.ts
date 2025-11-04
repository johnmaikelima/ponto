import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const projectId = searchParams.get("projectId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Buscar registros com filtros
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (projectId) {
      where.projectId = projectId
    } else if (companyId) {
      where.project = {
        companyId: companyId
      }
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.timestamp.lte = end
      }
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    })

    // Agrupar por funcionário e calcular horas
    const employeeHours: any = {}

    records.forEach((record) => {
      const key = `${record.userId}-${record.projectId}`
      
      if (!employeeHours[key]) {
        employeeHours[key] = {
          userId: record.userId,
          userName: record.user.name,
          userEmail: record.user.email,
          projectId: record.projectId,
          projectName: record.project.name,
          companyId: record.project.companyId,
          companyName: record.project.company.name,
          entries: [],
          exits: [],
          hotelDepartures: [],
          totalHours: 0,
          totalDays: 0,
          days: {},
        }
      }

      const dateKey = new Date(record.timestamp).toISOString().split("T")[0]

      if (!employeeHours[key].days[dateKey]) {
        employeeHours[key].days[dateKey] = {
          date: dateKey,
          hotelDeparture: null,
          entry: null,
          exit: null,
          hours: 0,
        }
      }

      if (record.type === "ENTRY") {
        employeeHours[key].entries.push(record)
        employeeHours[key].days[dateKey].entry = record.timestamp
      } else if (record.type === "EXIT") {
        employeeHours[key].exits.push(record)
        employeeHours[key].days[dateKey].exit = record.timestamp
      } else if (record.type === "HOTEL_DEPARTURE") {
        employeeHours[key].hotelDepartures.push(record)
        employeeHours[key].days[dateKey].hotelDeparture = record.timestamp
      }
    })

    // Calcular horas trabalhadas por dia
    Object.keys(employeeHours).forEach((key) => {
      const employee = employeeHours[key]
      let totalMinutes = 0
      let daysWorked = 0

      Object.keys(employee.days).forEach((dateKey) => {
        const day = employee.days[dateKey]
        
        if (day.entry && day.exit) {
          const entryTime = new Date(day.entry).getTime()
          const exitTime = new Date(day.exit).getTime()
          const minutes = (exitTime - entryTime) / (1000 * 60)
          
          day.hours = minutes / 60
          totalMinutes += minutes
          daysWorked++
        }
      })

      employee.totalHours = totalMinutes / 60
      employee.totalDays = daysWorked
      employee.daysArray = Object.values(employee.days)
    })

    // Converter para array e ordenar
    const report = Object.values(employeeHours).sort((a: any, b: any) => {
      return a.userName.localeCompare(b.userName)
    })

    // Calcular totais gerais
    const summary = {
      totalEmployees: new Set(report.map((r: any) => r.userId)).size,
      totalProjects: new Set(report.map((r: any) => r.projectId)).size,
      totalHours: report.reduce((sum: number, r: any) => sum + r.totalHours, 0),
      totalDays: report.reduce((sum: number, r: any) => sum + r.totalDays, 0),
    }

    return NextResponse.json({
      report,
      summary,
      filters: {
        companyId,
        projectId,
        userId,
        startDate,
        endDate,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}
