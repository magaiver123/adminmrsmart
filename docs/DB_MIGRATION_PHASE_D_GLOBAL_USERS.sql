-- Phase D: consolidacao de usuarios globais
-- Data sugerida: 2026-03-10
-- Objetivo: remover a tabela de vinculo por loja (store_users)
-- somente apos validar que a aplicacao nao depende mais dela.

begin;

-- 1) Backup fisico da tabela atual para auditoria e rollback manual
create table if not exists public.store_users_backup_20260310 as
select *
from public.store_users;

-- 2) Validacao rapida de backup
-- select count(*) from public.store_users;
-- select count(*) from public.store_users_backup_20260310;

-- 3) Remocao da tabela legado
drop table if exists public.store_users;

commit;
