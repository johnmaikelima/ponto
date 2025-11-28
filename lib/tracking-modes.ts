// Configuração dos modos de rastreamento e seus fluxos

export const TRACKING_MODES = {
  SIMPLE: {
    label: "Simples (Entrada e Saída no Cliente)",
    description: "Apenas entrada e saída no local do cliente/obra",
    flow: ["CLIENT_ARRIVAL", "CLIENT_DEPARTURE"],
    flowLabels: {
      CLIENT_ARRIVAL: "Chegada no Cliente",
      CLIENT_DEPARTURE: "Saída do Cliente"
    }
  },
  
  DAY_TO_DAY: {
    label: "Dia a Dia (Empresa)",
    description: "Entrada e saída na empresa (casa -> empresa -> casa)",
    flow: ["COMPANY_ARRIVAL", "COMPANY_DEPARTURE"],
    flowLabels: {
      COMPANY_ARRIVAL: "Chegada na Empresa",
      COMPANY_DEPARTURE: "Saída da Empresa"
    }
  },
  
  COMPANY_TO_CLIENT: {
    label: "Empresa -> Cliente -> Empresa",
    description: "Saída de casa, passa na empresa, vai ao cliente, volta na empresa e vai para casa",
    flow: [
      "HOME_DEPARTURE",
      "COMPANY_ARRIVAL",
      "COMPANY_DEPARTURE",
      "CLIENT_ARRIVAL",
      "CLIENT_DEPARTURE",
      "COMPANY_ARRIVAL",
      "COMPANY_DEPARTURE",
      "HOME_ARRIVAL"
    ],
    flowLabels: {
      HOME_DEPARTURE: "Saída de Casa",
      COMPANY_ARRIVAL: "Chegada na Empresa",
      COMPANY_DEPARTURE: "Saída da Empresa",
      CLIENT_ARRIVAL: "Chegada no Cliente",
      CLIENT_DEPARTURE: "Saída do Cliente",
      HOME_ARRIVAL: "Chegada em Casa"
    }
  },
  
  HOME_TO_CLIENT: {
    label: "Casa -> Cliente -> Casa (Direto)",
    description: "Sai de casa direto para o cliente e volta direto para casa",
    flow: [
      "HOME_DEPARTURE",
      "CLIENT_ARRIVAL",
      "CLIENT_DEPARTURE",
      "HOME_ARRIVAL"
    ],
    flowLabels: {
      HOME_DEPARTURE: "Saída de Casa",
      CLIENT_ARRIVAL: "Chegada no Cliente",
      CLIENT_DEPARTURE: "Saída do Cliente",
      HOME_ARRIVAL: "Chegada em Casa"
    }
  },
  
  HOTEL_TO_CLIENT: {
    label: "Hotel -> Cliente -> Hotel",
    description: "Saída do hotel, chegada no cliente, saída do cliente, chegada no hotel",
    flow: [
      "HOTEL_DEPARTURE",
      "CLIENT_ARRIVAL",
      "CLIENT_DEPARTURE",
      "HOTEL_ARRIVAL"
    ],
    flowLabels: {
      HOTEL_DEPARTURE: "Saída do Hotel",
      CLIENT_ARRIVAL: "Chegada no Cliente",
      CLIENT_DEPARTURE: "Saída do Cliente",
      HOTEL_ARRIVAL: "Chegada no Hotel"
    }
  },
  
  WITH_HOTEL: {
    label: "Cliente com Hotel (Legado)",
    description: "Casa -> Empresa -> Hotel -> Cliente -> Hotel -> Empresa -> Casa",
    flow: [
      "HOME_DEPARTURE",
      "COMPANY_ARRIVAL",
      "COMPANY_DEPARTURE",
      "HOTEL_ARRIVAL",
      "HOTEL_DEPARTURE",
      "CLIENT_ARRIVAL",
      "CLIENT_DEPARTURE",
      "HOTEL_ARRIVAL",
      "HOTEL_DEPARTURE",
      "COMPANY_ARRIVAL",
      "COMPANY_DEPARTURE",
      "HOME_ARRIVAL"
    ],
    flowLabels: {
      HOME_DEPARTURE: "Saída de Casa",
      COMPANY_ARRIVAL: "Chegada na Empresa",
      COMPANY_DEPARTURE: "Saída da Empresa",
      HOTEL_ARRIVAL: "Chegada no Hotel",
      HOTEL_DEPARTURE: "Saída do Hotel",
      CLIENT_ARRIVAL: "Chegada no Cliente",
      CLIENT_DEPARTURE: "Saída do Cliente",
      HOME_ARRIVAL: "Chegada em Casa"
    }
  },
  
  CLIENT_WITH_HOTEL: {
    label: "Cliente com Hotel",
    description: "Casa -> Empresa -> Hotel -> Cliente -> Hotel -> Empresa -> Casa",
    flow: [
      "HOME_DEPARTURE",
      "COMPANY_ARRIVAL",
      "COMPANY_DEPARTURE",
      "HOTEL_ARRIVAL",
      "HOTEL_DEPARTURE",
      "CLIENT_ARRIVAL",
      "CLIENT_DEPARTURE",
      "HOTEL_ARRIVAL",
      "HOTEL_DEPARTURE",
      "COMPANY_ARRIVAL",
      "COMPANY_DEPARTURE",
      "HOME_ARRIVAL"
    ],
    flowLabels: {
      HOME_DEPARTURE: "Saída de Casa",
      COMPANY_ARRIVAL: "Chegada na Empresa",
      COMPANY_DEPARTURE: "Saída da Empresa",
      HOTEL_ARRIVAL: "Chegada no Hotel",
      HOTEL_DEPARTURE: "Saída do Hotel",
      CLIENT_ARRIVAL: "Chegada no Cliente",
      CLIENT_DEPARTURE: "Saída do Cliente",
      HOME_ARRIVAL: "Chegada em Casa"
    }
  }
} as const

export type TrackingModeKey = keyof typeof TRACKING_MODES

// Função para obter o próximo tipo de registro esperado
export function getNextRecordType(
  trackingMode: TrackingModeKey,
  currentRecords: string[]
): string | null {
  const mode = TRACKING_MODES[trackingMode]
  if (!mode) return null
  
  const flow = mode.flow
  const currentIndex = currentRecords.length
  
  if (currentIndex >= flow.length) {
    return null // Fluxo completo
  }
  
  return flow[currentIndex]
}

// Função para verificar se o fluxo do dia está completo
export function isFlowComplete(
  trackingMode: TrackingModeKey,
  currentRecords: string[]
): boolean {
  const mode = TRACKING_MODES[trackingMode]
  if (!mode) return false
  
  return currentRecords.length >= mode.flow.length
}

// Função para obter label do tipo de registro
export function getRecordTypeLabel(
  trackingMode: TrackingModeKey,
  recordType: string
): string {
  // Labels para tipos legados
  const legacyLabels: Record<string, string> = {
    ENTRY: "Entrada",
    EXIT: "Saída",
    HOTEL_DEPARTURE: "Saída do Hotel"
  }
  
  if (legacyLabels[recordType]) {
    return legacyLabels[recordType]
  }
  
  const mode = TRACKING_MODES[trackingMode]
  if (!mode) return recordType
  
  return mode.flowLabels[recordType as keyof typeof mode.flowLabels] || recordType
}

// Função para obter cor do tipo de registro
export function getRecordTypeColor(recordType: string): {
  bg: string
  text: string
  icon: string
} {
  const colors: Record<string, { bg: string; text: string; icon: string }> = {
    HOME_DEPARTURE: { bg: "bg-blue-100", text: "text-blue-600", icon: "🏠" },
    HOME_ARRIVAL: { bg: "bg-blue-100", text: "text-blue-600", icon: "🏠" },
    COMPANY_ARRIVAL: { bg: "bg-purple-100", text: "text-purple-600", icon: "🏢" },
    COMPANY_DEPARTURE: { bg: "bg-purple-100", text: "text-purple-600", icon: "🏢" },
    CLIENT_ARRIVAL: { bg: "bg-green-100", text: "text-green-600", icon: "📍" },
    CLIENT_DEPARTURE: { bg: "bg-red-100", text: "text-red-600", icon: "📍" },
    HOTEL_ARRIVAL: { bg: "bg-yellow-100", text: "text-yellow-600", icon: "🏨" },
    HOTEL_DEPARTURE: { bg: "bg-orange-100", text: "text-orange-600", icon: "🏨" },
    // Legado
    ENTRY: { bg: "bg-green-100", text: "text-green-600", icon: "📍" },
    EXIT: { bg: "bg-red-100", text: "text-red-600", icon: "📍" }
  }
  
  return colors[recordType] || { bg: "bg-gray-100", text: "text-gray-600", icon: "📌" }
}
