-- Cuando una especialista se junta con otra en la misma sesion.
--
-- Maria Virginia acompana a la terapeuta titular, o la suple cuando falta. No
-- habia donde anotarlo, asi que la sesion se guardaba con la especialidad de
-- ELLA — "Kids Club" — y ese es el area que acababa en el expediente: cuatro
-- sesiones de septiembre quedaron como Kids Club, y de ahi "Kids Club" se
-- colo en la lista de terapias de Isaac y de Samson, que estan en Terapia
-- Ocupacional. El expediente decia que el nino recibe una terapia que no
-- recibe.
--
-- Kids Club se queda como area: es un servicio real del centro. Lo que faltaba
-- era separar "que terapia fue" de "quien la dio y con quien".
--
-- `modalidad` es texto libre y no un enum a proposito. El centro nombra sus
-- figuras — acompanamiento, suplencia, co-terapia, observacion — y anadir una
-- nueva no puede exigir una migracion. La pantalla ofrece las conocidas y deja
-- escribir otra.
alter table sessions add column if not exists modalidad text;

-- Con quien. Sin esto, "suplencia" no dice a quien se suple, que es justo el
-- dato por el que se mira.
alter table sessions add column if not exists con_especialista text references users(id);

comment on column sessions.modalidad is
  'Nulo = la dio una sola persona. Si no: acompanamiento, suplencia o como lo llame el centro.';
comment on column sessions.con_especialista is
  'La otra especialista: a quien se acompana o a quien se suple.';
