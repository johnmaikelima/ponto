# Sistema de Marcação de Ponto

Sistema completo para controle de ponto de funcionários em obras, desenvolvido com Next.js 14, TypeScript, Prisma e TailwindCSS.

## 🚀 Funcionalidades

### Painel do Funcionário
- ✅ Marcação de entrada e saída
- ✅ Seleção de obra
- ✅ Captura automática de geolocalização
- ✅ Visualização de registros do dia
- ✅ Interface intuitiva e responsiva

### Painel Administrativo
- ✅ Dashboard com estatísticas gerais
- ✅ Visualização de todos os registros de ponto
- ✅ Gerenciamento de funcionários
- ✅ Gerenciamento de obras
- ✅ Gerenciamento de empresas
- ✅ Exportação de relatórios
- ✅ Visualização de localização no mapa

## 🛠️ Tecnologias Utilizadas

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para banco de dados
- **MongoDB** - Banco de dados NoSQL (via MongoDB Atlas - gratuito)
- **NextAuth.js** - Autenticação
- **TailwindCSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## 🔧 Instalação

### ⚡ Instalação Rápida

**Siga o guia completo:** [INSTALACAO-MONGODB.md](./INSTALACAO-MONGODB.md)

### 📝 Resumo dos Comandos

1. **Instale as dependências**

```bash
npm install
```

2. **Configure o MongoDB Atlas (GRATUITO)**

- Crie conta em: https://www.mongodb.com/cloud/atlas/register
- Crie um cluster gratuito (M0)
- Obtenha a connection string
- Configure o arquivo `.env` (veja guia completo)

3. **Configure as variáveis de ambiente**

```bash
copy .env.example .env
```

Edite o `.env` e adicione sua connection string do MongoDB:

```env
DATABASE_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/sistema-ponto?retryWrites=true&w=majority"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Gere o Prisma Client**

```bash
npx prisma generate
```

5. **Popule o banco de dados**

```bash
npx prisma db seed
```

6. **Inicie o servidor**

```bash
npm run dev
```

7. **Acesse o sistema**

Abra: `http://localhost:3000`

## 👥 Credenciais de Acesso

### Administrador
- **Email:** admin@sistema.com
- **Senha:** admin123

### Funcionários
- **Email:** joao@email.com | **Senha:** 123456
- **Email:** maria@email.com | **Senha:** 123456
- **Email:** pedro@email.com | **Senha:** 123456

## 📁 Estrutura do Projeto

```
Ponto/
├── app/                      # App Router do Next.js
│   ├── api/                  # API Routes
│   │   ├── auth/            # Autenticação NextAuth
│   │   └── time-records/    # Endpoints de registros
│   ├── admin/               # Painel administrativo
│   ├── employee/            # Painel do funcionário
│   ├── login/               # Página de login
│   ├── dashboard/           # Redirecionamento
│   ├── layout.tsx           # Layout raiz
│   └── globals.css          # Estilos globais
├── components/              # Componentes React
│   ├── admin/              # Componentes do admin
│   ├── employee/           # Componentes do funcionário
│   └── ui/                 # Componentes UI (shadcn)
├── lib/                    # Utilitários e configurações
│   ├── auth.ts            # Configuração NextAuth
│   ├── prisma.ts          # Cliente Prisma
│   └── utils.ts           # Funções utilitárias
├── prisma/                # Configuração do Prisma
│   ├── schema.prisma      # Schema do banco
│   └── seed.ts            # Dados iniciais
└── types/                 # Definições de tipos TypeScript
```

## 🗄️ Modelo de Dados

### User (Usuário)
- id, email, name, password
- role: ADMIN | EMPLOYEE
- companyId (opcional)

### Company (Empresa)
- id, name, cnpj

### Project (Obra)
- id, name, location, description
- companyId
- active (boolean)

### TimeRecord (Registro de Ponto)
- id, userId, projectId
- type: ENTRY | EXIT
- timestamp
- latitude, longitude (geolocalização)
- notes

## 🔐 Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT via NextAuth.js
- Middleware de proteção de rotas
- Validação de permissões por role

## 📱 Recursos Adicionais

### Geolocalização
O sistema captura automaticamente a localização do funcionário ao marcar o ponto (se permitido pelo navegador).

### Responsividade
Interface totalmente responsiva, funcionando em desktop, tablet e mobile.

### Exportação de Dados
Administradores podem exportar relatórios em Excel (funcionalidade a ser implementada).

## 🚀 Deploy

### Preparação para Produção

1. **Altere o banco de dados para PostgreSQL** (recomendado para produção)

Edite `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Configure as variáveis de ambiente de produção**

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_SECRET="chave-secreta-forte-e-aleatoria"
NEXTAUTH_URL="https://seu-dominio.com"
```

3. **Execute o build**

```bash
npm run build
```

4. **Inicie em produção**

```bash
npm start
```

### Deploy em Plataformas

- **Vercel**: Conecte o repositório e configure as variáveis de ambiente
- **Railway**: Suporta PostgreSQL nativo
- **Heroku**: Configure o Postgres add-on

## 📝 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Cria build de produção
npm start            # Inicia servidor de produção
npm run lint         # Executa linter
npx prisma studio    # Abre interface visual do banco
npx prisma migrate   # Cria nova migração
```

## 🤝 Contribuindo

Este é um projeto desenvolvido para atender necessidades específicas de controle de ponto em obras.

## 📄 Licença

Este projeto é privado e de uso interno.

## 🐛 Problemas Conhecidos

- A funcionalidade de exportação para Excel está em desenvolvimento
- Filtros avançados na tabela de registros serão implementados

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com o desenvolvedor.

---

**Desenvolvido com ❤️ para melhor gestão de obras**
