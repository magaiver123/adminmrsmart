# Como o Sistema Está Organizado

## Visão geral
Hoje o projeto está dividido em 4 partes principais:

1. `app/`:
Páginas visuais do painel e rotas de backend (`app/api/admin/*`).

2. `src/services/`:
Arquivos que fazem chamadas para as APIs internas do sistema.

3. `components/`:
Componentes visuais reutilizáveis (layout, tabelas, botões, etc).

4. `lib/`:
Infraestrutura compartilhada (ex.: conexão segura com Supabase no servidor).

## Fluxo padrão de dados (novo padrão)
O fluxo oficial agora é:

1. Página (frontend) solicita uma ação.
2. Service (`src/services`) chama a rota em `/api/admin/*`.
3. Rota API valida os dados e executa regras de negócio.
4. Rota API acessa o banco no servidor.
5. Resposta volta para a página.

Esse padrão evita expor acesso ao banco no navegador.

## Módulos administrativos e rotas

- `produtos`: `/api/admin/store-products`, `/api/admin/products-global`
- `categorias`: `/api/admin/categories`
- `totens`: `/api/admin/totems`
- `estoque`: `/api/admin/stock`
- `kiosk`: `/api/admin/kiosk-slides`
- `pedidos`: `/api/admin/orders`
- `usuarios`: `/api/admin/users`
- `lojas` (gestão completa): `/api/admin/stores-management`
- `lojas` (somente lojas ativas no sidebar): `/api/admin/stores`
- autenticação/perfil/dashboard:
  - `/api/admin/login`
  - `/api/admin/logout`
  - `/api/admin/profile`
  - `/api/admin/dashboard`

## O que foi removido para simplificar

- Páginas que acessavam o banco direto no navegador.
- Arquivos `actions.ts` antigos dos módulos migrados.
- cliente Supabase no frontend (`lib/supabase/client.ts`).

## Padrão de nomes e responsabilidade

- `app/api/admin/<modulo>/route.ts`: regras de backend do módulo.
- `src/services/<modulo>.service.ts`: chamadas do frontend para backend.
- `app/<modulo>/page.tsx`: somente interface e estado da tela.

## Regras de segurança adotadas

- Validação de entrada no backend.
- Filtro por loja aplicado no backend.
- Operações sensíveis não rodam no navegador.
