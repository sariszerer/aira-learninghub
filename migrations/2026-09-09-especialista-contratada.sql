-- Datos de la especialista que AIRA coloca en el colegio, y su contrato.
--
-- Van en schools y no en tutors porque describen el CONTRATO con ese centro —
-- a quien se coloco, con que cedula y como se le localiza — y es lo que la
-- administracion necesita a mano al abrir la ficha del colegio. La fila de
-- tutors sigue siendo quien acompana a cada estudiante.
alter table schools
  add column if not exists especialista_nombre   text,
  add column if not exists especialista_cedula   text,
  add column if not exists especialista_telefono text,
  add column if not exists especialista_email    text;

-- El contrato firmado es un documento del colegio, como los demas. Sin este
-- tipo el insert fallaba contra documents_type_check — el mismo fallo silencioso
-- que ya se dio con plan_trabajo y pautas_crianza.
alter table documents drop constraint if exists documents_type_check;
alter table documents add constraint documents_type_check check (type = any (array[
  'anamnesis', 'evaluacion', 'reporte', 'informe', 'plan_trabajo', 'pautas_crianza',
  'plan_trabajo_tutor', 'supervision', 'tutor_quincenal', 'plan_preescolar',
  'seguimiento_caso', 'informe_familia', 'minuta_interdisciplinaria', 'contrato'
]));
