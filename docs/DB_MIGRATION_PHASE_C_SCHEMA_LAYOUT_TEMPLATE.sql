-- FASE C - TEMPLATE DE ORGANIZACAO POR SCHEMA
-- Execute somente apos Fase A e B estarem estaveis.
-- Objetivo: mover tabelas por dominio mantendo compatibilidade gradual.

begin;

create schema if not exists identity;
create schema if not exists catalog;
create schema if not exists tenant;
create schema if not exists sales;
create schema if not exists inventory;

-- Exemplo de movimentacao (executar em etapas, validando dependencias):
-- alter table public.users set schema identity;
-- alter table public.password_resets set schema identity;
-- alter table public.admin_sessions set schema identity;
-- alter table public.admin_login_logs set schema identity;
-- alter table public.login_attempts set schema identity;
--
-- alter table public.categories set schema catalog;
-- alter table public.products set schema catalog;
--
-- alter table public.stores set schema tenant;
-- alter table public.totems set schema tenant;
-- alter table public.store_users set schema tenant;
-- alter table public.store_categories set schema tenant;
-- alter table public.store_products set schema tenant;
-- alter table public.kiosk_slides set schema tenant;
--
-- alter table public.orders set schema sales;
--
-- alter table public.product_stock set schema inventory;
-- alter table public.stock_movements set schema inventory;

-- Compatibilidade temporaria em public (views):
-- create or replace view public.users as select * from identity.users;
-- create or replace view public.categories as select * from catalog.categories;
-- create or replace view public.products as select * from catalog.products;
-- create or replace view public.orders as select * from sales.orders;
-- create or replace view public.product_stock as select * from inventory.product_stock;
-- create or replace view public.stock_movements as select * from inventory.stock_movements;
-- create or replace view public.stores as select * from tenant.stores;
-- create or replace view public.store_products as select * from tenant.store_products;
-- create or replace view public.store_users as select * from tenant.store_users;
-- create or replace view public.store_categories as select * from tenant.store_categories;
-- create or replace view public.totems as select * from tenant.totems;
-- create or replace view public.kiosk_slides as select * from tenant.kiosk_slides;

commit;
