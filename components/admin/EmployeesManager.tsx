"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Mail, Building2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import EmployeeDialog from "./EmployeeDialog"

interface EmployeesManagerProps {
  employees: any[]
  companies: any[]
}

export default function EmployeesManager({ employees, companies }: EmployeesManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleNew = () => {
    setSelectedEmployee(null)
    setDialogOpen(true)
  }

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee)
    setDialogOpen(true)
  }

  const handleDelete = async (employee: any) => {
    if (!confirm(`Tem certeza que deseja excluir o funcionário "${employee.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao excluir funcionário")
      }

      toast({
        title: "Sucesso!",
        description: "Funcionário excluído com sucesso",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Funcionários</CardTitle>
            <CardDescription>Gerencie os funcionários do sistema</CardDescription>
          </div>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{employee.name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {employee.email}
                  </span>
                  {employee.company && (
                    <span className="flex items-center">
                      <Building2 className="w-3 h-3 mr-1" />
                      {employee.company.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>Editar</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(employee)}>Remover</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
        companies={companies}
        onSuccess={handleSuccess}
      />
    </Card>
  )
}
