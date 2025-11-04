"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FileCheck, Calendar, MapPin } from "lucide-react"
import Image from "next/image"

interface TermAcceptanceViewerProps {
  acceptances: any[]
}

export default function TermAcceptanceViewer({ acceptances }: TermAcceptanceViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="w-5 h-5" />
          Aceites de Termo
        </CardTitle>
        <CardDescription>
          Funcionários que aceitaram o termo de uso e política de privacidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        {acceptances.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nenhum funcionário aceitou o termo ainda
          </p>
        ) : (
          <div className="space-y-4">
            {acceptances.map((acceptance) => (
              <div key={acceptance.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{acceptance.user.name}</h3>
                    <p className="text-sm text-gray-500">{acceptance.user.email}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <FileCheck className="w-3 h-3 mr-1" />
                    Aceito
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(acceptance.acceptedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {acceptance.ipAddress && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>IP: {acceptance.ipAddress}</span>
                    </div>
                  )}
                </div>

                {acceptance.signature && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-2">Assinatura:</p>
                    <div className="bg-gray-50 p-2 rounded border inline-block">
                      <img 
                        src={acceptance.signature} 
                        alt="Assinatura" 
                        className="h-20 w-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
