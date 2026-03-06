# Limpeza e Padrões Adotados

## O que foi padronizado

- O frontend passou a usar serviços em `src/services`.
- Esses serviços chamam somente rotas internas em `app/api/admin`.
- Regras de negócio e validações foram centralizadas no backend (rotas API).

## Arquivos removidos por estarem obsoletos/duplicados

- `app/categorias/actions.ts`
- `app/estoque/actions.ts`
- `app/totens/actions.ts`
- `app/lojas/actions.ts`
- `app/produtos/actions.ts`
- `lib/supabase/client.ts`

## Rotas API criadas nesta rodada

- `app/api/admin/orders/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/kiosk-slides/route.ts`
- `app/api/admin/categories/route.ts`
- `app/api/admin/totems/route.ts`
- `app/api/admin/stock/route.ts`
- `app/api/admin/stores-management/route.ts`

## Services de frontend criados nesta rodada

- `src/services/orders.service.ts`
- `src/services/users.service.ts`
- `src/services/kioskSlides.service.ts`
- `src/services/categories.service.ts`
- `src/services/totems.service.ts`
- `src/services/stock.service.ts`
- `src/services/stores.service.ts`

## Resultado esperado

- Menos código duplicado.
- Menor risco de exposição de regra de negócio no navegador.
- Estrutura mais fácil para localizar responsabilidades (tela, service, backend).
