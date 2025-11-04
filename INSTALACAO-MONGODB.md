# 🚀 Instalação Completa - Sistema de Ponto com MongoDB

## 📋 Pré-requisitos

- ✅ Node.js 18+ instalado ([Download aqui](https://nodejs.org/))
- ✅ Conta no MongoDB Atlas (gratuita) OU MongoDB instalado localmente

---

## 🎯 OPÇÃO 1: MongoDB Atlas (Nuvem - RECOMENDADO) ⭐

### Passo 1: Criar Conta no MongoDB Atlas (GRATUITO)

1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie sua conta (pode usar Google/GitHub)
3. Escolha o plano **FREE** (M0 Sandbox - 512MB)

### Passo 2: Criar um Cluster

1. Após login, clique em **"Build a Database"**
2. Escolha **"M0 FREE"**
3. Selecione a região mais próxima (ex: São Paulo)
4. Clique em **"Create Cluster"** (leva 1-3 minutos)

### Passo 3: Configurar Acesso

1. **Criar Usuário do Banco:**
   - Clique em **"Database Access"** no menu lateral
   - Clique em **"Add New Database User"**
   - Escolha **"Password"**
   - Defina usuário e senha (anote isso!)
   - Em "Database User Privileges", escolha **"Read and write to any database"**
   - Clique em **"Add User"**

2. **Liberar Acesso de Qualquer IP:**
   - Clique em **"Network Access"** no menu lateral
   - Clique em **"Add IP Address"**
   - Clique em **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Clique em **"Confirm"**

### Passo 4: Obter Connection String

1. Volte para **"Database"** no menu lateral
2. Clique em **"Connect"** no seu cluster
3. Escolha **"Connect your application"**
4. Copie a connection string (algo como):
   ```
   mongodb+srv://usuario:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **IMPORTANTE:** Substitua `<password>` pela senha que você criou!

---

## 🎯 OPÇÃO 2: MongoDB Local (Avançado)

Se preferir instalar MongoDB localmente:

1. Download: https://www.mongodb.com/try/download/community
2. Instale o MongoDB Community Server
3. Inicie o serviço MongoDB
4. Use a connection string: `mongodb://localhost:27017/sistema-ponto`

---

## 💻 Instalação do Projeto

### 1️⃣ Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

**O que isso faz:**
- Instala Next.js, React, TypeScript
- Instala Prisma ORM
- Instala TailwindCSS e componentes UI
- Instala todas as bibliotecas necessárias

⏱️ **Tempo:** 2-5 minutos

---

### 2️⃣ Configurar Variáveis de Ambiente

1. **Copie o arquivo de exemplo:**

```bash
copy .env.example .env
```

2. **Edite o arquivo `.env`** e cole sua connection string do MongoDB:

```env
# Cole aqui a connection string do MongoDB Atlas
DATABASE_URL="mongodb+srv://seuusuario:suasenha@cluster0.xxxxx.mongodb.net/sistema-ponto?retryWrites=true&w=majority"

NEXTAUTH_SECRET="mude-isso-para-algo-secreto-e-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
```

**⚠️ IMPORTANTE:**
- Substitua `seuusuario` e `suasenha` pelos dados do MongoDB Atlas
- Mantenha o nome do banco `sistema-ponto` na URL

---

### 3️⃣ Gerar Prisma Client

Execute este comando para gerar o código do Prisma para MongoDB:

```bash
npx prisma generate
```

**O que isso faz:**
- Lê o schema do Prisma
- Gera código TypeScript otimizado para MongoDB
- Cria o cliente do banco de dados

⏱️ **Tempo:** 10-30 segundos

---

### 4️⃣ Popular o Banco de Dados

Execute o seed para criar dados iniciais:

```bash
npx prisma db seed
```

**O que isso cria:**
- ✅ 1 Administrador
- ✅ 3 Funcionários
- ✅ 2 Empresas
- ✅ 3 Obras
- ✅ Registros de ponto de exemplo

⏱️ **Tempo:** 5-10 segundos

**Você verá algo assim:**
```
Iniciando seed do banco de dados...
Empresas criadas
Obras criadas
Administrador criado
Funcionários criados
Registros de ponto criados

=== Seed concluído com sucesso! ===

Credenciais de acesso:

Administrador:
Email: admin@sistema.com
Senha: admin123

Funcionários:
Email: joao@email.com / Senha: 123456
Email: maria@email.com / Senha: 123456
Email: pedro@email.com / Senha: 123456
```

---

### 5️⃣ Iniciar o Servidor

```bash
npm run dev
```

**O servidor iniciará em:** http://localhost:3000

⏱️ Aguarde aparecer:
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

---

## 🎉 Pronto! Agora é só usar!

### 🔐 Fazer Login

Acesse: **http://localhost:3000**

#### Como Administrador:
- **Email:** admin@sistema.com
- **Senha:** admin123
- **Acesso:** Painel completo com relatórios

#### Como Funcionário:
- **Email:** joao@email.com
- **Senha:** 123456
- **Acesso:** Marcar entrada/saída

---

## 🔍 Verificar se está Funcionando

### Ver os dados no MongoDB Atlas:

1. No MongoDB Atlas, clique em **"Browse Collections"**
2. Você verá as collections:
   - `User` (usuários)
   - `Company` (empresas)
   - `Project` (obras)
   - `TimeRecord` (registros de ponto)

### Ver os dados localmente:

Execute este comando para abrir interface visual:

```bash
npx prisma studio
```

Abrirá em: http://localhost:5555

---

## 📝 Resumo dos Comandos

```bash
# 1. Instalar dependências
npm install

# 2. Copiar arquivo de ambiente
copy .env.example .env
# (Depois edite o .env com sua connection string)

# 3. Gerar Prisma Client
npx prisma generate

# 4. Popular banco de dados
npx prisma db seed

# 5. Iniciar servidor
npm run dev
```

---

## ❓ Problemas Comuns

### ❌ Erro: "Authentication failed"
- Verifique se a senha no `.env` está correta
- Certifique-se de substituir `<password>` pela senha real

### ❌ Erro: "Could not connect to server"
- Verifique se liberou o IP no Network Access (0.0.0.0/0)
- Aguarde alguns minutos após criar o cluster

### ❌ Erro: "npm install" falha
- Certifique-se de ter Node.js 18+ instalado
- Execute: `npm cache clean --force` e tente novamente

### ❌ Porta 3000 já em uso
- Use outra porta: `npm run dev -- -p 3001`

---

## 🎓 Comandos Úteis

```bash
# Ver dados no navegador
npx prisma studio

# Resetar banco de dados (apaga tudo)
npx prisma db push --force-reset
npx prisma db seed

# Verificar conexão
npx prisma db pull
```

---

## 🌟 Vantagens do MongoDB Atlas

- ✅ **Gratuito** até 512MB
- ✅ **Backups automáticos**
- ✅ **Monitoramento em tempo real**
- ✅ **Sem necessidade de servidor**
- ✅ **Escalável** quando precisar

---

## 📞 Precisa de Ajuda?

Se algo não funcionar:
1. Verifique se seguiu todos os passos
2. Confira se a connection string está correta no `.env`
3. Certifique-se de que o cluster do MongoDB Atlas está ativo

**Boa sorte! 🚀**
