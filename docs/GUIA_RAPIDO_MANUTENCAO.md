# Guia Rápido de Manutenção

## Se algo quebrar, olhe nesta ordem

1. Veja se o erro aparece na tela.
2. Confira se a rota da API do módulo existe em `app/api/admin/...`.
3. Confira se o service correspondente existe em `src/services/...`.
4. Verifique se a página está chamando o service correto.
5. Verifique se os campos obrigatórios estão sendo enviados.

## Onde alterar cada tipo de coisa

- Texto e layout: `app/<modulo>/page.tsx`
- Regra de validação: `app/api/admin/<modulo>/route.ts`
- Comunicação da tela com backend: `src/services/<modulo>.service.ts`
- Componentes visuais reutilizáveis: `components/`

## Boas práticas para novas telas

1. Não acessar banco direto no frontend.
2. Criar primeiro a rota em `/api/admin/<modulo>`.
3. Criar o service no `src/services`.
4. Só depois ligar a página ao service.
5. Manter mensagens de erro claras para usuário.

## Checklist antes de concluir uma alteração

- [ ] Tela carrega sem loja selecionada (se o módulo depende de loja).
- [ ] Tela carrega com loja selecionada.
- [ ] Filtro por loja funciona.
- [ ] Criar/editar/excluir continuam funcionando.
- [ ] Erros aparecem de forma amigável.
- [ ] Não existe acesso direto ao banco no frontend.

## Observação sobre evolução

A página `admin-usuarios` ficou fora desta rodada e será migrada em uma fase separada.
