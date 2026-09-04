-- Rollback de 2026-09-04-roles-fase3-rls.sql
--
-- Restaura las 27 politicas tal como estaban antes del corte. Generado desde
-- pg_policies, no escrito a mano: reconstruir a ojo la clausula de una
-- politica RLS es como se deja una tabla abierta sin notarlo.

begin;

drop policy if exists "children_insert" on public.children;
drop policy if exists "children_select" on public.children;
drop policy if exists "children_update" on public.children;
drop policy if exists "documents_insert" on public.documents;
drop policy if exists "documents_select" on public.documents;
drop policy if exists "documents_update" on public.documents;
drop policy if exists "gabinete_sessions_all" on public.gabinete_sessions;
drop policy if exists "meetings_insert" on public.meetings;
drop policy if exists "meetings_select" on public.meetings;
drop policy if exists "objectives_delete" on public.objectives;
drop policy if exists "objectives_insert" on public.objectives;
drop policy if exists "objectives_select" on public.objectives;
drop policy if exists "objectives_update" on public.objectives;
drop policy if exists "parent_reports_delete" on public.parent_reports;
drop policy if exists "parent_reports_insert" on public.parent_reports;
drop policy if exists "parent_reports_select" on public.parent_reports;
drop policy if exists "parent_reports_update" on public.parent_reports;
drop policy if exists "schools_all" on public.schools;
drop policy if exists "sessions_insert" on public.sessions;
drop policy if exists "sessions_select" on public.sessions;
drop policy if exists "sessions_update" on public.sessions;
drop policy if exists "tutor_reports_insert" on public.tutor_reports;
drop policy if exists "tutor_reports_select" on public.tutor_reports;
drop policy if exists "tutors_delete" on public.tutors;
drop policy if exists "tutors_insert" on public.tutors;
drop policy if exists "tutors_select" on public.tutors;
drop policy if exists "tutors_update" on public.tutors;

create policy "children_insert" on public.children
  for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))));

create policy "children_select" on public.children
  for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE ((u.role = 'specialist'::text) AND (u.id = ANY (children.assigned_specialists))))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE ((u.role = 'shadow'::text) AND (u.assigned_child_id = children.id))))));

create policy "children_update" on public.children
  for update to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE ((u.role = 'specialist'::text) AND (u.id = ANY (children.assigned_specialists)))))))
  with check (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE ((u.role = 'specialist'::text) AND (u.id = ANY (children.assigned_specialists)))))));

create policy "documents_insert" on public.documents
  for insert to authenticated
  with check (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = documents.child_id))))));

create policy "documents_select" on public.documents
  for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = documents.child_id)))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE ((u.role = 'shadow'::text) AND (u.assigned_child_id = documents.child_id))))));

create policy "documents_update" on public.documents
  for update to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = documents.child_id))))))
  with check (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = documents.child_id))))));

create policy "gabinete_sessions_all" on public.gabinete_sessions
  for all to authenticated
  using ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))));

create policy "meetings_insert" on public.meetings
  for insert to authenticated
  with check (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = meetings.child_id))))));

create policy "meetings_select" on public.meetings
  for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = meetings.child_id))))));

create policy "objectives_delete" on public.objectives
  for delete to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = objectives.child_id))))));

create policy "objectives_insert" on public.objectives
  for insert to authenticated
  with check (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = objectives.child_id))))));

create policy "objectives_select" on public.objectives
  for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = objectives.child_id)))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE ((u.role = 'shadow'::text) AND (u.assigned_child_id = objectives.child_id))))));

create policy "objectives_update" on public.objectives
  for update to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = objectives.child_id))))))
  with check (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = objectives.child_id))))));

create policy "parent_reports_delete" on public.parent_reports
  for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))));

create policy "parent_reports_insert" on public.parent_reports
  for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))));

create policy "parent_reports_select" on public.parent_reports
  for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = parent_reports.child_id))))));

create policy "parent_reports_update" on public.parent_reports
  for update to authenticated
  using ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))));

create policy "schools_all" on public.schools
  for all to authenticated
  using ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))));

create policy "sessions_insert" on public.sessions
  for insert to authenticated
  with check (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = sessions.child_id))))));

create policy "sessions_select" on public.sessions
  for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = sessions.child_id)))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE ((u.role = 'shadow'::text) AND (u.assigned_child_id = sessions.child_id))))));

create policy "sessions_update" on public.sessions
  for update to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.id = sessions.specialist_id)))))
  with check (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.id = sessions.specialist_id)))));

create policy "tutor_reports_insert" on public.tutor_reports
  for insert to authenticated
  with check (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE ((u.role = 'shadow'::text) AND (u.assigned_child_id = tutor_reports.child_id))))));

create policy "tutor_reports_select" on public.tutor_reports
  for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))) OR (EXISTS ( SELECT 1
   FROM (current_app_user() u(id, role, assigned_child_id)
     JOIN children c ON ((u.id = ANY (c.assigned_specialists))))
  WHERE ((u.role = 'specialist'::text) AND (c.id = tutor_reports.child_id)))) OR (EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE ((u.role = 'shadow'::text) AND (u.assigned_child_id = tutor_reports.child_id))))));

create policy "tutors_delete" on public.tutors
  for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))));

create policy "tutors_insert" on public.tutors
  for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))));

create policy "tutors_select" on public.tutors
  for select to authenticated
  using (true);

create policy "tutors_update" on public.tutors
  for update to authenticated
  using ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM current_app_user() u(id, role, assigned_child_id)
  WHERE (u.role = ANY (ARRAY['admin'::text, 'clinical_director'::text])))));

commit;