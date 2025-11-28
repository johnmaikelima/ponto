import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import EmployeeDashboard from "@/components/employee/EmployeeDashboard"

export default async function EmployeePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "EMPLOYEE") {
    redirect("/login")
  }

  const projects = await prisma.project.findMany({
    where: {
      active: true,
    },
    include: {
      company: true,
    },
  })

  const todayRecords = await prisma.timeRecord.findMany({
    where: {
      userId: session.user.id,
      timestamp: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    include: {
      project: {
        include: {
          company: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  })

  return (
    <EmployeeDashboard
      user={session.user}
      projects={projects}
      todayRecords={todayRecords}
    />
  )
}
