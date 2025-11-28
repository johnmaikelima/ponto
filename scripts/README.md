# 🗑️ Scripts de Manutenção

## Limpar Registros

Este script deleta todos os registros de ponto, anotações e justificativas, mas **mantém**:
- ✅ Usuários
- ✅ Empresas
- ✅ Obras/Projetos
- ✅ Configurações do sistema

### Como usar:

```bash
npm run clear-records
```

### O que será deletado:

- ❌ Registros de ponto (TimeRecord)
- ❌ Anotações diárias (DailyNote)
- ❌ Justificativas (Justification)
- ❌ Aceites de termo (TermAcceptance)

### Exemplo de saída:

```
🗑️  Iniciando limpeza de registros...

📋 Deletando anotações diárias...
   ✓ 45 anotações deletadas
📝 Deletando justificativas...
   ✓ 12 justificativas deletadas
⏰ Deletando registros de ponto...
   ✓ 1234 registros de ponto deletados
📄 Deletando aceites de termo...
   ✓ 5 aceites deletados

✅ Limpeza concluída com sucesso!

📊 Mantidos:
   👥 5 usuários
   🏢 2 empresas
   🏗️  3 obras
   ⚙️  1 configurações do sistema

✨ Script finalizado!
```

### ⚠️ ATENÇÃO:

- Esta ação **NÃO PODE SER DESFEITA**
- Faça backup do banco de dados antes se necessário
- Use apenas em ambiente de desenvolvimento/testes
- Em produção, considere fazer backup antes

### Quando usar:

- 🧪 Limpar dados de teste
- 🔄 Resetar sistema para nova fase
- 🐛 Resolver problemas de dados inconsistentes
- 📊 Começar novo período de registro
