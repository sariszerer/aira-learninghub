alter table documents drop constraint if exists documents_type_check;
alter table documents add constraint documents_type_check check (type = any (array[
  'anamnesis', 'evaluacion', 'reporte', 'informe', 'plan_trabajo', 'pautas_crianza',
  'plan_trabajo_tutor', 'supervision', 'tutor_quincenal', 'plan_preescolar',
  'seguimiento_caso', 'informe_familia', 'minuta_interdisciplinaria'
]));
alter table schools
  drop column if exists especialista_nombre,
  drop column if exists especialista_cedula,
  drop column if exists especialista_telefono,
  drop column if exists especialista_email;
