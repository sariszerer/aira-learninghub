import React, { useState } from "react";
import { Plus } from "lucide-react";
import { T } from "../../theme.js";
import { can } from "../../permissions.js";
import { Btn } from "../../ui/index.js";
import DocumentsSection from "../DocumentsSection.jsx";
import AddDocumentModal from "../modals/AddDocumentModal.jsx";

function PlanTrabajoTab({ child, documents, users, currentUser, onAddDocument, onUpdateDocument }) {
  const [adding, setAdding] = useState(false);
  const canAdd = can(currentUser, "workplan:create");
  const planDocs = documents.filter(d => d.childId === child.id && d.type === "plan_trabajo");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13.5, color: T.inkSoft }}>Plan terapéutico por disciplina — objetivos, metodología y metas del proceso.</div>
        {canAdd && <Btn variant="amber" icon={Plus} onClick={() => setAdding(true)}>Agregar plan</Btn>}
      </div>
      {adding && (
        <AddDocumentModal type="plan_trabajo" onClose={() => setAdding(false)}
          onSave={(d) => { onAddDocument({ ...d, childId: child.id, authorId: currentUser.id, id: `d-plan-${Date.now()}` }); setAdding(false); }}
        />
      )}
      <DocumentsSection type="plan_trabajo" documents={planDocs} users={users}
        onAdd={() => setAdding(true)} onUpdateDocument={onUpdateDocument} currentUser={currentUser} />
    </div>
  );
}

export default PlanTrabajoTab;
