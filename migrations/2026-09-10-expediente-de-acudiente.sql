-- Expedientes de madres y padres atendidos en Pautas de Crianza.
--
-- Son personas a las que el centro atiende con plan de trabajo, sesiones y
-- objetivos: exactamente las tres cosas que la tabla children ya sabe llevar,
-- con sus permisos, su alcance por especialista asignada y sus politicas.
--
-- Por eso viven aqui y no en una tabla propia. Una tabla nueva obligaria a
-- duplicar sessions, objectives, documents y las cuatro politicas de RLS de
-- cada una, y a mantener las dos copias en paralelo para siempre. El precio de
-- meterlas en `children` es que el nombre de la tabla se queda corto; el precio
-- de la otra via es todo lo demas.
--
-- `tipo` es lo que separa las dos cosas en la interfaz: un acudiente no tiene
-- anamnesis del desarrollo ni reportes para la familia — la familia ES el
-- paciente — y pedirle fecha de nacimiento o colegio no significa nada.
alter table children
  add column if not exists tipo text not null default 'nino'
    check (tipo in ('nino', 'acudiente'));

-- A quien acompana, cuando es la madre o el padre de un paciente del centro.
--
-- Opcional a proposito: tambien se atiende a familias cuyo hijo no es paciente
-- aqui. Se pone null y el expediente se sostiene solo.
alter table children
  add column if not exists acudiente_de text references children(id) on delete set null;

create index if not exists children_tipo_idx on children(tipo);

comment on column children.tipo is
  'nino = paciente del centro. acudiente = madre o padre atendido en Pautas de Crianza.';
