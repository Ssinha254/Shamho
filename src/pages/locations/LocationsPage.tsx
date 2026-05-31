import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/shared/PageHeader";
import { Plus, QrCode, Pencil, Trash2 } from "lucide-react";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useLocations } from "../../hooks";
import { FormInput } from "../../components/forms/FormInput";
import { locationsService } from "../../services/locations.service";

export const LocationsPage: React.FC = () => {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const locationsQuery = useLocations();
  const { data: locations = [], isLoading, error } = locationsQuery;
  const [form, setForm] = React.useState({ location_code: "", remarks: "" });

  const saveLocation = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editingId) {
        await locationsService.updateLocation(editingId, form);
      } else {
        await locationsService.createLocation(form);
      }
      setCreateOpen(false);
      setEditingId(null);
      setForm({ location_code: "", remarks: "" });
      await locationsQuery.refetch();
      alert(editingId ? "Location updated" : "Location created");
    } catch (err: any) {
      alert("Failed to save location: " + (err.message || String(err)));
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ location_code: "", remarks: "" });
    setCreateOpen(true);
  };

  const openEdit = (loc: (typeof locations)[number]) => {
    setEditingId(loc.id);
    setForm({
      location_code: loc.location_code,
      remarks: loc.remarks || "",
    });
    setCreateOpen(true);
  };

  const deleteLocation = async (id: string) => {
    if (!window.confirm("Delete this location?")) return;
    try {
      await locationsService.deleteLocation(id);
      await locationsQuery.refetch();
      alert("Location deleted");
    } catch (err: any) {
      alert("Failed to delete location: " + (err.message || String(err)));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Locations"
        description="Manage storage locations and QR codes"
        action={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={openCreate}
          >
            <Plus size={18} />
            New Location
          </button>
        }
      />

      {isLoading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          Failed to load locations from Supabase.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {locations.map((loc) => (
            <div key={loc.id} className="card">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {loc.location_code}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {loc.remarks || "—"}
                  </p>
                </div>
                <Link
                  to={`/location/${loc.location_code}`}
                  className="rounded-xl p-2 hover:bg-background"
                  aria-label={`Open QR location view for ${loc.location_code}`}
                >
                  <QrCode size={20} className="text-primary" />
                </Link>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <button
                  className="rounded-md p-1 text-text-secondary hover:bg-background"
                  onClick={() => openEdit(loc)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="rounded-md p-1 text-danger hover:bg-background"
                  onClick={() => deleteLocation(loc.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <p className="mb-2 text-xs text-text-secondary">
                    Total Stock
                  </p>
                  <p className="text-2xl font-bold text-text">
                    {loc.total_stock}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs text-text-secondary">
                    Active Batches
                  </p>
                  <p className="text-lg font-semibold text-text">
                    {loc.total_batches}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">
                {editingId ? "Edit Location" : "New Location"}
              </h3>
              <button
                className="btn-secondary text-sm"
                onClick={() => setCreateOpen(false)}
              >
                Close
              </button>
            </div>
            <form className="space-y-4" onSubmit={saveLocation}>
              <FormInput
                label="Location Code"
                value={form.location_code}
                onChange={(e) =>
                  setForm({ ...form, location_code: e.target.value })
                }
                required
              />
              <FormInput
                label="Remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Update" : "Save Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
