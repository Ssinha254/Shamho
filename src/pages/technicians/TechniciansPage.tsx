import React from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import { useTechnicians } from "../../hooks";
import { techniciansService } from "../../services/technicians.service";

type TechRole = "WAREHOUSE_WORKER" | "AI_TECHNICIAN" | "TRUCK_DRIVER";

type FormState = {
  technician_code: string;
  technician_name: string;
  mobile: string;
  assigned_area: string;
  role: TechRole;
};

const emptyForm: FormState = {
  technician_code: "",
  technician_name: "",
  mobile: "",
  assigned_area: "",
  role: "AI_TECHNICIAN",
};

const roleLabels: Record<TechRole, string> = {
  WAREHOUSE_WORKER: "Warehouse Worker",
  AI_TECHNICIAN: "AI Technician",
  TRUCK_DRIVER: "Truck Driver",
};

export const TechniciansPage: React.FC = () => {
  const techniciansQuery = useTechnicians();
  const { data: technicians = [], isLoading, error } = techniciansQuery;
  const [searchTerm, setSearchTerm] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  const filteredTechnicians = React.useMemo(
    () =>
      technicians.filter((tech) =>
        [tech.name, tech.technician_code, tech.mobile, tech.assigned_area]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [technicians, searchTerm],
  );

  const byRole = React.useMemo(() => {
    return {
      WAREHOUSE_WORKER: filteredTechnicians.filter(
        (tech) => tech.role === "WAREHOUSE_WORKER",
      ),
      AI_TECHNICIAN: filteredTechnicians.filter(
        (tech) => tech.role === "AI_TECHNICIAN",
      ),
      TRUCK_DRIVER: filteredTechnicians.filter(
        (tech) => tech.role === "TRUCK_DRIVER",
      ),
    };
  }, [filteredTechnicians]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (tech: (typeof technicians)[number]) => {
    setEditingId(tech.id);
    setForm({
      technician_code: tech.technician_code,
      technician_name: tech.name,
      mobile: tech.mobile,
      assigned_area: tech.assigned_area,
      role: tech.role,
    });
    setModalOpen(true);
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editingId) {
        await techniciansService.updateTechnician(editingId, form);
        alert("Technician updated");
      } else {
        await techniciansService.createTechnician(form);
        alert("Technician created");
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await techniciansQuery.refetch();
    } catch (err: any) {
      alert("Failed to save technician: " + (err.message || String(err)));
    }
  };

  const deleteTechnician = async (id: string) => {
    if (!window.confirm("Delete this technician?")) return;
    try {
      await techniciansService.deleteTechnician(id);
      await techniciansQuery.refetch();
      alert("Technician deleted");
    } catch (err: any) {
      alert("Failed to delete technician: " + (err.message || String(err)));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technicians"
        description="Manage warehouse workers, AI technicians, and truck drivers"
        action={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={openCreate}
          >
            <Plus size={18} />
            Add Staff
          </button>
        }
      />

      <div className="card">
        <FormInput
          placeholder="Search by name, code, mobile, or area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          Failed to load technicians from Supabase.
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.keys(byRole) as TechRole[]).map((role) => (
            <div key={role} className="card">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-lg font-semibold text-text">
                  {roleLabels[role]}
                </h3>
                <span className="text-sm text-text-secondary">
                  {byRole[role].length} total
                </span>
              </div>

              {byRole[role].length === 0 ? (
                <div className="text-sm text-text-secondary">No records.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                          Mobile
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                          Assigned Area
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-text-secondary">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {byRole[role].map((tech) => (
                        <tr
                          key={tech.id}
                          className="border-b border-border hover:bg-background"
                        >
                          <td className="px-4 py-3 font-medium text-primary">
                            {tech.technician_code}
                          </td>
                          <td className="px-4 py-3 text-text">{tech.name}</td>
                          <td className="px-4 py-3 text-text-secondary">
                            {tech.mobile || "-"}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {tech.assigned_area || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="rounded-md p-1 text-text-secondary hover:bg-background"
                                onClick={() => openEdit(tech)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="rounded-md p-1 text-danger hover:bg-background"
                                onClick={() => deleteTechnician(tech.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">
                {editingId ? "Edit Staff" : "Add Staff"}
              </h3>
              <button
                className="btn-secondary text-sm"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <FormSelect
                label="Role"
                value={form.role}
                options={[
                  { value: "WAREHOUSE_WORKER", label: "Warehouse Worker" },
                  { value: "AI_TECHNICIAN", label: "AI Technician" },
                  { value: "TRUCK_DRIVER", label: "Truck Driver" },
                ]}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as TechRole })
                }
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Technician Code"
                  placeholder="e.g. 001"
                  value={form.technician_code}
                  onChange={(e) =>
                    setForm({ ...form, technician_code: e.target.value })
                  }
                  required
                />
                <FormInput
                  label="Name"
                  value={form.technician_name}
                  onChange={(e) =>
                    setForm({ ...form, technician_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Mobile"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
                <FormInput
                  label="Assigned Area"
                  value={form.assigned_area}
                  onChange={(e) =>
                    setForm({ ...form, assigned_area: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
