import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearRecords() {
  try {
    console.log('🗑️  Iniciando limpeza de registros...\n')

    // Deletar em ordem (respeitando relações)
    
    console.log('📋 Deletando anotações diárias...')
    const dailyNotes = await prisma.dailyNote.deleteMany({})
    console.log(`   ✓ ${dailyNotes.count} anotações deletadas`)

    console.log('📝 Deletando justificativas...')
    const justifications = await prisma.justification.deleteMany({})
    console.log(`   ✓ ${justifications.count} justificativas deletadas`)

    console.log('⏰ Deletando registros de ponto...')
    const timeRecords = await prisma.timeRecord.deleteMany({})
    console.log(`   ✓ ${timeRecords.count} registros de ponto deletados`)

    console.log('📄 Deletando aceites de termo...')
    const termAcceptances = await prisma.termAcceptance.deleteMany({})
    console.log(`   ✓ ${termAcceptances.count} aceites deletados`)

    console.log('\n✅ Limpeza concluída com sucesso!')
    console.log('\n📊 Mantidos:')
    
    const users = await prisma.user.count()
    const companies = await prisma.company.count()
    const projects = await prisma.project.count()
    const settings = await prisma.systemSettings.count()
    
    console.log(`   👥 ${users} usuários`)
    console.log(`   🏢 ${companies} empresas`)
    console.log(`   🏗️  ${projects} obras`)
    console.log(`   ⚙️  ${settings} configurações do sistema`)

  } catch (error) {
    console.error('❌ Erro ao limpar registros:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
clearRecords()
  .then(() => {
    console.log('\n✨ Script finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })
