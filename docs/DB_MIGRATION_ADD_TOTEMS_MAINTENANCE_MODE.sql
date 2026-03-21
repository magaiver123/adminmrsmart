-- Adiciona modo de manutencao por totem sem alterar o status atual (active/inactive).
-- Script idempotente.

alter table public.totems
  add column if not exists maintenance_mode boolean not null default false;

