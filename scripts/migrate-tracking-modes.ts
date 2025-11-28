// Script para migrar valores antigos de TrackingMode para os novos
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Iniciando migração de TrackingMode...')

  // Buscar todos os projetos
  const projects = await prisma.$queryRaw`
    SELECT _id, name, trackingMode FROM Project
  ` as any[]

  console.log(`📊 Encontrados ${projects.length} projetos`)

  let migratedCount = 0

  for (const project of projects) {
    const oldMode = project.trackingMode
    let newMode = oldMode

    // Mapear valores antigos para novos
    if (oldMode === 'WITH_HOTEL') {
      newMode = 'CLIENT_WITH_HOTEL'
      console.log(`  ✓ Migrando projeto "${project.name}": WITH_HOTEL → CLIENT_WITH_HOTEL`)
      
      await prisma.$executeRaw`
        UPDATE Project 
        SET trackingMode = ${newMode}
        WHERE _id = ${project._id}
      `
      
      migratedCount++
    }
  }

  console.log(`\n✅ Migração concluída!`)
  console.log(`   - Total de projetos: ${projects.length}`)
  console.log(`   - Projetos migrados: ${migratedCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
