import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed do banco de dados...')

  // Criar empresas
  const empresa1 = await prisma.company.upsert({
    where: { cnpj: '12.345.678/0001-90' },
    update: {},
    create: {
      name: 'Construtora ABC',
      cnpj: '12.345.678/0001-90',
    },
  })

  const empresa2 = await prisma.company.upsert({
    where: { cnpj: '98.765.432/0001-10' },
    update: {},
    create: {
      name: 'Engenharia XYZ',
      cnpj: '98.765.432/0001-10',
    },
  })

  console.log('Empresas criadas')

  // Criar obras
  const obra1 = await prisma.project.create({
    data: {
      name: 'Edifício Residencial Centro',
      location: 'Rua das Flores, 123 - Centro',
      description: 'Construção de edifício residencial com 10 andares',
      companyId: empresa1.id,
      active: true,
    },
  })

  const obra2 = await prisma.project.create({
    data: {
      name: 'Shopping Norte',
      location: 'Av. Principal, 456 - Zona Norte',
      description: 'Reforma e ampliação de shopping center',
      companyId: empresa1.id,
      active: true,
    },
  })

  const obra3 = await prisma.project.create({
    data: {
      name: 'Condomínio Jardins',
      location: 'Rua dos Jardins, 789 - Bairro Jardim',
      description: 'Construção de condomínio residencial',
      companyId: empresa2.id,
      active: true,
    },
  })

  console.log('Obras criadas')

  // Criar usuário administrador
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      name: 'Administrador',
      password: hashedPasswordAdmin,
      role: 'ADMIN',
    },
  })

  console.log('Administrador criado')

  // Criar funcionários
  const hashedPasswordEmployee = await bcrypt.hash('123456', 10)
  
  const funcionario1 = await prisma.user.upsert({
    where: { email: 'joao@email.com' },
    update: {},
    create: {
      email: 'joao@email.com',
      name: 'João Silva',
      password: hashedPasswordEmployee,
      role: 'EMPLOYEE',
      companyId: empresa1.id,
    },
  })

  const funcionario2 = await prisma.user.upsert({
    where: { email: 'maria@email.com' },
    update: {},
    create: {
      email: 'maria@email.com',
      name: 'Maria Santos',
      password: hashedPasswordEmployee,
      role: 'EMPLOYEE',
      companyId: empresa1.id,
    },
  })

  const funcionario3 = await prisma.user.upsert({
    where: { email: 'pedro@email.com' },
    update: {},
    create: {
      email: 'pedro@email.com',
      name: 'Pedro Oliveira',
      password: hashedPasswordEmployee,
      role: 'EMPLOYEE',
      companyId: empresa2.id,
    },
  })

  console.log('Funcionários criados')

  // Criar alguns registros de ponto de exemplo
  const hoje = new Date()
  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)

  await prisma.timeRecord.create({
    data: {
      userId: funcionario1.id,
      projectId: obra1.id,
      type: 'ENTRY',
      timestamp: new Date(hoje.setHours(8, 0, 0, 0)),
      latitude: -23.5505,
      longitude: -46.6333,
    },
  })

  await prisma.timeRecord.create({
    data: {
      userId: funcionario1.id,
      projectId: obra1.id,
      type: 'EXIT',
      timestamp: new Date(hoje.setHours(12, 0, 0, 0)),
      latitude: -23.5505,
      longitude: -46.6333,
    },
  })

  await prisma.timeRecord.create({
    data: {
      userId: funcionario2.id,
      projectId: obra2.id,
      type: 'ENTRY',
      timestamp: new Date(ontem.setHours(7, 30, 0, 0)),
      latitude: -23.5505,
      longitude: -46.6333,
    },
  })

  console.log('Registros de ponto criados')
  console.log('\n=== Seed concluído com sucesso! ===\n')
  console.log('Credenciais de acesso:')
  console.log('\nAdministrador:')
  console.log('Email: admin@sistema.com')
  console.log('Senha: admin123')
  console.log('\nFuncionários:')
  console.log('Email: joao@email.com / Senha: 123456')
  console.log('Email: maria@email.com / Senha: 123456')
  console.log('Email: pedro@email.com / Senha: 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
