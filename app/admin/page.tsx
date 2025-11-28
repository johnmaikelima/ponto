import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AdminDashboard from "@/components/admin/AdminDashboard"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const [employees, companies, projects, recentRecords, termAcceptances, dailyNotes] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
      },
      include: {
        company: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.company.findMany({
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
    }),
    prisma.project.findMany({
      include: {
        company: true,
        _count: {
          select: {
            timeRecords: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.timeRecord.findMany({
      take: 50,
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
        timestamp: "desc",
      },
    }),
    prisma.termAcceptance.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        acceptedAt: "desc",
      },
    }),
    prisma.dailyNote.findMany({
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
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 100,
    }),
  ])

  return (
    <AdminDashboard
      user={session.user}
      employees={employees}
      companies={companies}
      projects={projects}
      recentRecords={recentRecords}
      termAcceptances={termAcceptances}
      dailyNotes={dailyNotes}
    />
  )
}
