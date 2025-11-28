"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Pen, Eraser, Building2, User } from "lucide-react"

interface TermAcceptanceModalProps {
  open: boolean
  onAccepted: () => void
  user: {
    name: string
    email: string
  }
}

export default function TermAcceptanceModal({ open, onAccepted, user }: TermAcceptanceModalProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      // Carregar configurações da empresa
      loadCompanySettings()
      
      // Configurar canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.strokeStyle = "#000"
          ctx.lineWidth = 2
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
        }
      }
    }
  }, [open])

  const loadCompanySettings = async () => {
    try {
      setLoadingSettings(true)
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setCompanySettings(data)
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)
    setHasSignature(true)

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleAccept = async () => {
    if (!hasSignature) {
      toast({
        title: "Assinatura necessária",
        description: "Por favor, assine o termo antes de aceitar",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas não encontrado")

      // Converter canvas para base64
      const signature = canvas.toDataURL("image/png")

      const response = await fetch("/api/term-acceptance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao salvar aceite")
      }

      toast({
        title: "Termo aceito!",
        description: "Você pode começar a marcar ponto agora",
      })

      onAccepted()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Termo de Uso e Política de Privacidade
          </DialogTitle>
          <DialogDescription>
            Leia atentamente e assine para continuar
          </DialogDescription>
        </DialogHeader>

        {loadingSettings ? (
          <div className="py-8 text-center text-gray-500">
            Carregando...
          </div>
        ) : (
        <div className="space-y-4 py-4">
          {/* Cabeçalho com dados da empresa e colaborador */}
          <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
            {/* Dados da Empresa */}
            {companySettings && (
              <div className="flex items-start gap-3">
                {companySettings.companyLogo ? (
                  <img 
                    src={companySettings.companyLogo} 
                    alt="Logo" 
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <div className="h-16 w-16 bg-blue-100 rounded flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{companySettings.companyName || "Sistema de Ponto"}</h3>
                  {companySettings.companyCnpj && (
                    <p className="text-sm text-gray-600">CNPJ: {companySettings.companyCnpj}</p>
                  )}
                  {companySettings.companyAddress && (
                    <p className="text-sm text-gray-600">{companySettings.companyAddress}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    {companySettings.companyPhone && <span>Tel: {companySettings.companyPhone}</span>}
                    {companySettings.companyEmail && <span>Email: {companySettings.companyEmail}</span>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Dados do Colaborador */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Colaborador:</span>
                <span>{user.name}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{user.email}</span>
              </div>
            </div>
          </div>
          {/* Termo de Uso */}
          <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto text-sm">
            <h3 className="font-semibold mb-2">TERMO DE CONSENTIMENTO E ACEITE</h3>
            <p className="mb-3 text-gray-700">
              Eu, <strong>{user.name}</strong>, portador(a) do email <strong>{user.email}</strong>, 
              declaro estar ciente e concordo com os termos abaixo estabelecidos pela empresa 
              <strong> {companySettings?.companyName || "empregadora"}</strong>
              {companySettings?.companyCnpj && <>, CNPJ {companySettings.companyCnpj}</>}.
            </p>
            
            <h3 className="font-semibold mt-4 mb-2">1. TERMO DE USO DO SISTEMA DE CONTROLE DE PONTO</h3>
            <p className="mb-3 text-gray-700">
              Ao utilizar este sistema, você concorda com os seguintes termos:
            </p>
            
            <h4 className="font-medium mt-3 mb-1">1.1. Finalidade</h4>
            <p className="text-gray-700 mb-2">
              O sistema destina-se exclusivamente ao controle de jornada de trabalho, conforme Art. 74 da CLT.
            </p>

            <h4 className="font-medium mt-3 mb-1">1.2. Coleta de Dados</h4>
            <p className="text-gray-700 mb-2">
              Serão coletados: data, hora, localização (GPS), obra selecionada e tipo de marcação (entrada/saída).
            </p>

            <h4 className="font-medium mt-3 mb-1">1.3. Uso de Geolocalização</h4>
            <p className="text-gray-700 mb-2">
              A geolocalização será capturada apenas no momento da marcação de ponto, para fins de comprovação de presença no local de trabalho.
            </p>

            <h4 className="font-medium mt-3 mb-1">1.4. Responsabilidades</h4>
            <p className="text-gray-700 mb-2">
              Você é responsável por marcar o ponto corretamente e no horário adequado. Marcações incorretas podem ser questionadas.
            </p>

            <h3 className="font-semibold mt-4 mb-2">2. POLÍTICA DE PRIVACIDADE (LGPD)</h3>
            
            <h4 className="font-medium mt-3 mb-1">2.1. Dados Coletados</h4>
            <p className="text-gray-700 mb-2">
              • Nome, email e empresa<br />
              • Data e hora das marcações<br />
              • Coordenadas GPS (latitude e longitude)<br />
              • Obra/local de trabalho<br />
              • Endereço IP e navegador (para segurança)
            </p>

            <h4 className="font-medium mt-3 mb-1">2.2. Finalidade dos Dados</h4>
            <p className="text-gray-700 mb-2">
              Os dados serão utilizados EXCLUSIVAMENTE para:
              <br />• Controle de jornada de trabalho
              <br />• Cálculo de horas trabalhadas
              <br />• Geração de relatórios para o empregador
              <br />• Cumprimento de obrigações legais
            </p>

            <h4 className="font-medium mt-3 mb-1">2.3. Compartilhamento</h4>
            <p className="text-gray-700 mb-2">
              Seus dados NÃO serão compartilhados com terceiros, exceto quando exigido por lei ou ordem judicial.
            </p>

            <h4 className="font-medium mt-3 mb-1">2.4. Armazenamento</h4>
            <p className="text-gray-700 mb-2">
              Os dados serão armazenados por no mínimo 5 anos, conforme exigido pela legislação trabalhista.
            </p>

            <h4 className="font-medium mt-3 mb-1">2.5. Seus Direitos</h4>
            <p className="text-gray-700 mb-2">
              Você tem direito a:
              <br />• Acessar seus dados pessoais
              <br />• Solicitar correção de dados incorretos
              <br />• Solicitar portabilidade dos dados
              <br />• Revogar o consentimento (sujeito a consequências trabalhistas)
            </p>

            <h4 className="font-medium mt-3 mb-1">2.6. Segurança</h4>
            <p className="text-gray-700 mb-2">
              Utilizamos criptografia e medidas de segurança para proteger seus dados contra acesso não autorizado.
            </p>

            <h4 className="font-medium mt-3 mb-1">2.7. Consentimento</h4>
            <p className="text-gray-700 mb-2">
              Ao assinar este termo, você consente expressamente com a coleta, armazenamento e uso dos dados conforme descrito.
            </p>
          </div>

          {/* Canvas de Assinatura */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Pen className="w-4 h-4" />
                Assine abaixo com o dedo ou mouse
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
                disabled={!hasSignature}
              >
                <Eraser className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <canvas
                ref={canvasRef}
                width={700}
                height={200}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <p className="text-xs text-gray-500">
              Desenhe sua assinatura no espaço acima. Esta assinatura será armazenada junto com o aceite do termo.
            </p>
          </div>
        </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={loading || !hasSignature || loadingSettings}
            className="w-full"
          >
            {loading ? "Salvando..." : "Li e Aceito os Termos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
