import React from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Search, Pencil, Trash2 } from "lucide-react";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useAIRecords } from "../../hooks";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import { exportToExcel } from "../../utils/export";
import { aiService } from "../../services/ai.service";

export const AIRecordsPage: React.FC = () => {
  const recordsQuery = useAIRecords();
  const { data: records = [], isLoading, error } = recordsQuery;
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [technicianFilter, setTechnicianFilter] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editStatus, setEditStatus] = React.useState("PENDING");

  const filteredRecords = React.useMemo(
    () =>
      records.filter((record) => {
        const matchesSearch = [
          record.member_name,
          record.animal_id,
          record.semen_batch_code,
          record.technician_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesStatus =
          !statusFilter || record.pregnancy_status === statusFilter;
        const matchesTechnician =
          !technicianFilter || record.technician_name === technicianFilter;
        const matchesDate =
          (!fromDate || record.date >= fromDate) &&
          (!toDate || record.date <= `${toDate}T23:59:59`);
        return (
          matchesSearch && matchesStatus && matchesTechnician && matchesDate
        );
      }),
    [records, searchTerm, statusFilter, technicianFilter, fromDate, toDate],
  );

  const filteredIds = React.useMemo(
    () => filteredRecords.map((record) => record.id),
    [filteredRecords],
  );
  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedIds.includes(id));

  const openEdit = (record: (typeof records)[number]) => {
    setEditId(record.id);
    setEditStatus(record.pregnancy_status);
  };

  const submitEdit = async () => {
    if (!editId) return;
    try {
      await aiService.updateAIRecordStatus(editId, editStatus as any);
      setEditId(null);
      await recordsQuery.refetch();
      alert("AI record updated");
    } catch (err: any) {
      alert("Failed to update AI record: " + (err.message || String(err)));
    }
  };

  const deleteRecord = async (id: string) => {
    if (!window.confirm("Delete this AI record?")) return;
    try {
      await aiService.deleteAIRecord(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      await recordsQuery.refetch();
      alert("AI record deleted");
    } catch (err: any) {
      alert("Failed to delete AI record: " + (err.message || String(err)));
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected AI record(s)?`))
      return;
    try {
      await aiService.deleteAIRecords(selectedIds);
      setSelectedIds([]);
      await recordsQuery.refetch();
      alert("Selected AI records deleted");
    } catch (err: any) {
      alert(
        "Failed to delete selected AI records: " + (err.message || String(err)),
      );
    }
  };

  const startSelection = () => {
    setSelectionMode(true);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const exportRecords = () => {
    const exportIds =
      selectionMode && selectedIds.length ? selectedIds : filteredIds;
    const exportRows = filteredRecords.filter((record) =>
      exportIds.includes(record.id),
    );

    exportToExcel(
      exportRows.map((record) => ({
        Farmer: record.member_name,
        AnimalID: record.animal_id,
        SemenBatch: record.semen_batch_code,
        Technician: record.technician_name,
        Status: record.pregnancy_status,
        Date: record.date,
      })),
      "ai-records",
      "AIRecords",
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Records"
        description="Artificial Insemination tracking"
        action={
          <>
            {selectionMode ? (
              <>
                <button
                  type="button"
                  className="btn-secondary flex items-center gap-2"
                  onClick={cancelSelection}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-secondary flex items-center gap-2"
                  disabled={!selectedIds.length}
                  onClick={deleteSelected}
                >
                  <Trash2 size={16} />
                  Delete{selectedIds.length ? ` (${selectedIds.length})` : ""}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-secondary flex items-center gap-2"
                onClick={startSelection}
              >
                <Trash2 size={16} />
                Select
              </button>
            )}
          </>
        }
      />

      <div className="card">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="flex items-center gap-2 md:col-span-2">
            <Search size={18} className="text-text-secondary" />
            <FormInput
              placeholder="Search farmer, animal, batch, or technician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent"
            />
          </div>
          <FormSelect
            options={[
              { value: "", label: "All Statuses" },
              { value: "PENDING", label: "Pending" },
              { value: "POSITIVE", label: "Positive" },
              { value: "NEGATIVE", label: "Negative" },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary whitespace-nowrap"
            onClick={exportRecords}
          >
            {selectionMode && selectedIds.length
              ? "Export Selected"
              : "Export Excel"}
          </button>
          <FormInput
            type="date"
            label="From"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <FormInput
            type="date"
            label="To"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <FormSelect
            label="Technician"
            options={[
              { value: "", label: "All Technicians" },
              ...Array.from(
                new Set(records.map((record) => record.technician_name)),
              ).map((name) => ({ value: name, label: name })),
            ]}
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
          />
        </div>

        {isLoading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : error ? (
          <div className="border border-border bg-white p-4 text-sm text-danger">
            Failed to load AI records from Supabase.
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="border border-border bg-white p-6 text-sm text-text-secondary">
            No AI records found in Supabase yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {selectionMode && (
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                      />
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Farmer
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Animal ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Semen Batch
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Technician
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-text-secondary">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Date
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-border hover:bg-background"
                  >
                    {selectionMode && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(record.id)}
                          onChange={() => toggleSelectOne(record.id)}
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 text-text font-medium">
                      {record.member_name}
                    </td>
                    <td className="py-3 px-4 text-primary font-medium">
                      {record.animal_id}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {record.semen_batch_code}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {record.technician_name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={record.pregnancy_status} />
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(record.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="rounded-md p-1 text-text-secondary hover:bg-background"
                          onClick={() => openEdit(record)}
                        >
                          <Pencil size={15} />
                        </button>
                        {selectionMode && (
                          <button
                            type="button"
                            className="rounded-md p-1 text-danger hover:bg-background"
                            onClick={() => deleteRecord(record.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md border border-border bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-text">Edit AI Record</h3>
            <div className="mt-4">
              <FormSelect
                label="Pregnancy Status"
                options={[
                  { value: "PENDING", label: "PENDING" },
                  { value: "POSITIVE", label: "POSITIVE" },
                  { value: "NEGATIVE", label: "NEGATIVE" },
                ]}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={submitEdit}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
