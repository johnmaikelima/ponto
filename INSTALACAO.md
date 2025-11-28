# 🚀 Guia Rápido de Instalação

## Passo a Passo para Executar o Sistema

### 1. Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

Isso instalará todas as bibliotecas necessárias (Next.js, Prisma, TailwindCSS, etc.)

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
copy .env.example .env
```

O arquivo `.env` já está configurado para desenvolvimento local. Não precisa alterar nada inicialmente.

### 3. Configurar o Banco de Dados

Execute as migrações do Prisma para criar as tabelas:

```bash
npx prisma migrate dev --name init
```

### 4. Popular o Banco com Dados Iniciais

Execute o seed para criar usuários, empresas e obras de exemplo:

```bash
npx prisma db seed
```

Isso criará:
- 1 administrador
- 3 funcionários
- 2 empresas
- 3 obras
- Alguns registros de ponto de exemplo

### 5. Iniciar o Servidor

```bash
npm run dev
```

O sistema estará disponível em: **http://localhost:3000**

### 6. Fazer Login

#### Como Administrador:
- **Email:** admin@sistema.com
- **Senha:** admin123

#### Como Funcionário:
- **Email:** joao@email.com
- **Senha:** 123456

## 📱 Funcionalidades Disponíveis

### Painel do Funcionário (`/employee`)
- Marcar entrada e saída
- Selecionar obra
- Ver registros do dia
- Localização GPS automática

### Painel Administrativo (`/admin`)
- Dashboard com estatísticas
- Visualizar todos os registros
- Gerenciar funcionários
- Gerenciar obras
- Gerenciar empresas
- Exportar relatórios em Excel

## 🔧 Comandos Úteis

```bash
# Visualizar banco de dados
npx prisma studio

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Resetar banco de dados
npx prisma migrate reset

# Build para produção
npm run build

# Executar em produção
npm start
```

## ❓ Problemas Comuns

### Erro ao instalar dependências
- Certifique-se de ter Node.js 18+ instalado
- Execute `npm cache clean --force` e tente novamente

### Erro ao executar migrações
- Delete a pasta `prisma/migrations` e o arquivo `prisma/dev.db`
- Execute novamente `npx prisma migrate dev --name init`

### Porta 3000 já em uso
- Altere a porta no comando: `npm run dev -- -p 3001`

## 📞 Suporte

Para dúvidas ou problemas, consulte o arquivo README.md completo.
