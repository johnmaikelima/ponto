"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Briefcase } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import CompanyDialog from "./CompanyDialog"

interface CompaniesManagerProps {
  companies: any[]
}

export default function CompaniesManager({ companies }: CompaniesManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleNew = () => {
    setSelectedCompany(null)
    setDialogOpen(true)
  }

  const handleEdit = (company: any) => {
    setSelectedCompany(company)
    setDialogOpen(true)
  }

  const handleDelete = async (company: any) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${company.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao excluir empresa")
      }

      toast({
        title: "Sucesso!",
        description: "Empresa excluída com sucesso",
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
            <CardTitle>Empresas</CardTitle>
            <CardDescription>Gerencie as empresas cadastradas</CardDescription>
          </div>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Empresa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <div key={company.id} className="border rounded-lg p-4">
              <h3 className="font-medium text-lg">{company.name}</h3>
              {company.cnpj && (
                <p className="text-sm text-gray-500 mt-1">CNPJ: {company.cnpj}</p>
              )}
              <div className="flex gap-4 mt-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  {company._count.employees} funcionários
                </div>
                <div className="flex items-center text-gray-600">
                  <Briefcase className="w-4 h-4 mr-1" />
                  {company._count.projects} obras
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(company)}>Editar</Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(company)}>Remover</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={selectedCompany}
        onSuccess={handleSuccess}
      />
    </Card>
  )
}
