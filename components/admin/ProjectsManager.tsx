"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Building2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import ProjectDialog from "./ProjectDialog"

interface ProjectsManagerProps {
  projects: any[]
  companies: any[]
}

export default function ProjectsManager({ projects, companies }: ProjectsManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleNew = () => {
    setSelectedProject(null)
    setDialogOpen(true)
  }

  const handleEdit = (project: any) => {
    setSelectedProject(project)
    setDialogOpen(true)
  }

  const handleDelete = async (project: any) => {
    if (!confirm(`Tem certeza que deseja excluir a obra "${project.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao excluir obra")
      }

      toast({
        title: "Sucesso!",
        description: "Obra excluída com sucesso",
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
            <CardTitle>Ordens de Serviço</CardTitle>
            <CardDescription>Gerencie as ordens de serviço cadastradas</CardDescription>
          </div>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{project.name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {project.location}
                    </div>
                    <div className="flex items-center">
                      <Building2 className="w-3 h-3 mr-1" />
                      {project.company.name}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      project.active 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {project.active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(project)}>Editar</Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(project)}>Remover</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
        companies={companies}
        onSuccess={handleSuccess}
      />
    </Card>
  )
}
