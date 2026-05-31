import React, { useMemo, useState } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useMembers } from "../../hooks";
import { membersService } from "../../services/members.service";
import { exportToExcel } from "../../utils/export";

type MemberFormState = {
  member_code: string;
  name: string;
  mobile: string;
  village: string;
  member_type: string;
  shares: number;
  credit_limit: number;
  outstanding: number;
};

const emptyForm: MemberFormState = {
  member_code: "",
  name: "",
  mobile: "",
  village: "",
  member_type: "SMALL",
  shares: 0,
  credit_limit: 0,
  outstanding: 0,
};

export const MembersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const membersQuery = useMembers();
  const { data: members = [], isLoading, error } = membersQuery;
  const [form, setForm] = useState<MemberFormState>(emptyForm);

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          [member.name, member.member_code, member.village, member.member_type]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) &&
          (!typeFilter || member.member_type === typeFilter) &&
          (!balanceFilter ||
            (balanceFilter === "OUTSTANDING" && member.outstanding > 0) ||
            (balanceFilter === "CLEAR" && member.outstanding <= 0)),
      ),
    [members, searchTerm, typeFilter, balanceFilter],
  );

  const filteredIds = useMemo(
    () => filteredMembers.map((member) => member.id),
    [filteredMembers],
  );
  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedIds.includes(id));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (member: (typeof members)[number]) => {
    setEditingId(member.id);
    setForm({
      member_code: member.member_code,
      name: member.name,
      mobile: "",
      village: member.village,
      member_type: member.member_type,
      shares: member.shares,
      credit_limit: 0,
      outstanding: member.outstanding,
    });
    setCreateOpen(true);
  };

  const submitMember = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editingId) {
        await membersService.updateMember(editingId, {
          member_code: form.member_code,
          name: form.name,
          village: form.village,
          member_type: form.member_type,
          shares: form.shares,
          outstanding: form.outstanding,
        } as any);
        alert("Member updated");
      } else {
        await membersService.createMember(form as any);
        alert("Member created");
      }
      setCreateOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await membersQuery.refetch();
    } catch (err: any) {
      alert("Failed to save member: " + (err.message || String(err)));
    }
  };

  const deleteMember = async (id: string) => {
    if (!window.confirm("Delete this member?")) return;
    try {
      await membersService.deleteMember(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      await membersQuery.refetch();
      alert("Member deleted");
    } catch (err: any) {
      alert("Failed to delete member: " + (err.message || String(err)));
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected member(s)?`))
      return;
    try {
      await membersService.deleteMembers(selectedIds);
      setSelectedIds([]);
      setSelectionMode(false);
      await membersQuery.refetch();
      alert("Selected members deleted");
    } catch (err: any) {
      alert(
        "Failed to delete selected members: " + (err.message || String(err)),
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

  const exportMembers = () => {
    const exportIds =
      selectionMode && selectedIds.length ? selectedIds : filteredIds;
    const exportRows = filteredMembers.filter((member) =>
      exportIds.includes(member.id),
    );

    exportToExcel(
      exportRows.map((member) => ({
        Code: member.member_code,
        Name: member.name,
        Village: member.village,
        Type: member.member_type,
        Shares: member.shares,
        Outstanding: member.outstanding,
      })),
      "members",
      "Members",
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage farmers and cooperative members"
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
                  onClick={deleteSelected}
                  disabled={!selectedIds.length}
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
            <button
              className="btn-primary flex items-center gap-2"
              onClick={openCreate}
            >
              <Plus size={18} />
              Add Member
            </button>
          </>
        }
      />

      <div className="card">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="flex items-center gap-2 md:col-span-2">
            <Search size={18} className="text-text-secondary" />
            <FormInput
              placeholder="Search by name, code, village, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent"
            />
          </div>
          <FormSelect
            options={[
              { value: "", label: "All Member Types" },
              { value: "SMALL", label: "SMALL" },
              { value: "MEDIUM", label: "MEDIUM" },
              { value: "LARGE", label: "LARGE" },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <div className="flex gap-2">
            <FormSelect
              options={[
                { value: "", label: "All Balances" },
                { value: "OUTSTANDING", label: "Outstanding Only" },
                { value: "CLEAR", label: "Clear Balance" },
              ]}
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary whitespace-nowrap"
              onClick={exportMembers}
            >
              {selectionMode && selectedIds.length
                ? "Export Selected"
                : "Export Excel"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : error ? (
          <div className="border border-border bg-white p-4 text-sm text-danger">
            Failed to load members from Supabase.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {selectionMode && (
                    <th className="py-3 px-4 text-left">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                      />
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary text-sm">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary text-sm">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary text-sm">
                    Village
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary text-sm">
                    Type
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary text-sm">
                    Shares
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary text-sm">
                    Outstanding
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-text-secondary text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border hover:bg-background transition"
                  >
                    {selectionMode && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(member.id)}
                          onChange={() => toggleSelectOne(member.id)}
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm font-medium text-primary">
                      {member.member_code}
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      {member.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {member.village || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="border border-border bg-white px-2 py-1 text-xs font-medium text-text-secondary">
                        {member.member_type || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-text text-right">
                      {member.shares}
                    </td>
                    <td className="py-3 px-4 text-sm text-danger font-medium text-right">
                      ₹{member.outstanding.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="rounded-md p-1 text-text-secondary hover:bg-background"
                          onClick={() => openEdit(member)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1 text-danger hover:bg-background"
                          onClick={() => deleteMember(member.id)}
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

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">
                {editingId ? "Edit Member" : "Add Member"}
              </h3>
              <button
                className="btn-secondary text-sm"
                onClick={() => setCreateOpen(false)}
              >
                Close
              </button>
            </div>
            <form className="space-y-4" onSubmit={submitMember}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Member Code"
                  value={form.member_code}
                  onChange={(e) =>
                    setForm({ ...form, member_code: e.target.value })
                  }
                  required
                />
                <FormInput
                  label="Member Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  label="Village"
                  value={form.village}
                  onChange={(e) =>
                    setForm({ ...form, village: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormSelect
                  label="Member Type"
                  options={[
                    { value: "SMALL", label: "SMALL" },
                    { value: "MEDIUM", label: "MEDIUM" },
                    { value: "LARGE", label: "LARGE" },
                  ]}
                  value={form.member_type}
                  onChange={(e) =>
                    setForm({ ...form, member_type: e.target.value })
                  }
                />
                <FormInput
                  label="Shares"
                  type="number"
                  value={form.shares}
                  onChange={(e) =>
                    setForm({ ...form, shares: Number(e.target.value) })
                  }
                />
                <FormInput
                  label="Credit Limit"
                  type="number"
                  value={form.credit_limit}
                  onChange={(e) =>
                    setForm({ ...form, credit_limit: Number(e.target.value) })
                  }
                />
              </div>
              <FormInput
                label="Outstanding"
                type="number"
                value={form.outstanding}
                onChange={(e) =>
                  setForm({ ...form, outstanding: Number(e.target.value) })
                }
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
                  {editingId ? "Update Member" : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
