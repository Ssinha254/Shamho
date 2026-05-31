import React from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useInventory, useLocations, useProducts } from "../../hooks";
import { inventoryService } from "../../services/inventory.service";
import { exportToExcel } from "../../utils/export";
import { generateNextBatchCode } from "../../utils/batch-code";

type BatchFormState = {
  product_id: string;
  location_id: string;
  batch_code: string;
  quantity: number;
  cost: number;
  expiry_date: string;
  status: string;
};

const emptyForm: BatchFormState = {
  product_id: "",
  location_id: "",
  batch_code: "",
  quantity: 0,
  cost: 0,
  expiry_date: "",
  status: "IN_STOCK",
};

const isRawMaterial = (category: string) => {
  const normalized = (category || "").toUpperCase();
  return normalized.includes("RAW") || normalized.includes("MATERIAL");
};

const PAGE_SIZE = 8;

export const InventoryPage: React.FC = () => {
  const inventoryQuery = useInventory();
  const productsQuery = useProducts();
  const locationsQuery = useLocations();
  const { data: items = [], isLoading, error } = inventoryQuery;
  const { data: products = [] } = productsQuery;
  const { data: locations = [] } = locationsQuery;
  const nextBatchCode = React.useMemo(
    () => generateNextBatchCode(items.map((item) => item.batch_code)),
    [items],
  );

  const [searchTerm, setSearchTerm] = React.useState("");
  const [locationFilter, setLocationFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [editId, setEditId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState<BatchFormState>(emptyForm);
  const [finishedPage, setFinishedPage] = React.useState(1);
  const [rawPage, setRawPage] = React.useState(1);

  const filteredItems = React.useMemo(
    () =>
      items.filter(
        (item) =>
          [
            item.batch_code,
            item.product_name,
            item.location_code,
            item.category,
          ]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) &&
          (!locationFilter || item.location_code === locationFilter) &&
          (!statusFilter || item.status === statusFilter),
      ),
    [items, searchTerm, locationFilter, statusFilter],
  );

  const finishedItems = React.useMemo(
    () => filteredItems.filter((item) => !isRawMaterial(item.category)),
    [filteredItems],
  );
  const rawItems = React.useMemo(
    () => filteredItems.filter((item) => isRawMaterial(item.category)),
    [filteredItems],
  );

  const finishedTotalPages = Math.max(
    1,
    Math.ceil(finishedItems.length / PAGE_SIZE),
  );
  const rawTotalPages = Math.max(1, Math.ceil(rawItems.length / PAGE_SIZE));

  React.useEffect(() => {
    setFinishedPage((page) => Math.min(page, finishedTotalPages));
  }, [finishedTotalPages]);

  React.useEffect(() => {
    setRawPage((page) => Math.min(page, rawTotalPages));
  }, [rawTotalPages]);

  const paginatedFinishedItems = React.useMemo(
    () =>
      finishedItems.slice(
        (finishedPage - 1) * PAGE_SIZE,
        finishedPage * PAGE_SIZE,
      ),
    [finishedItems, finishedPage],
  );

  const paginatedRawItems = React.useMemo(
    () => rawItems.slice((rawPage - 1) * PAGE_SIZE, rawPage * PAGE_SIZE),
    [rawItems, rawPage],
  );

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, batch_code: nextBatchCode });
    setCreateOpen(true);
  };

  const openEdit = (item: (typeof items)[number]) => {
    setEditId(item.id);
    setForm({
      product_id: item.product_id,
      location_id: item.location_id,
      batch_code: item.batch_code,
      quantity: item.quantity,
      cost: item.cost || 0,
      expiry_date: item.expiry_date ? item.expiry_date.slice(0, 10) : "",
      status: item.status,
    });
    setCreateOpen(true);
  };

  const submitBatch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editId) {
        await inventoryService.updateBatch(editId, {
          batch_code: form.batch_code,
          quantity: form.quantity,
          cost_per_unit: form.cost,
          expiry_date: form.expiry_date || null,
          status: form.status,
        });
      } else {
        await inventoryService.createBatch({
          product_id: form.product_id,
          location_id: form.location_id,
          batch_code: form.batch_code,
          quantity: form.quantity,
          cost_per_unit: form.cost,
          expiry_date: form.expiry_date || null,
        });
      }
      setCreateOpen(false);
      setEditId(null);
      setForm(emptyForm);
      await inventoryQuery.refetch();
    } catch (err: any) {
      alert("Failed to save batch: " + (err.message || String(err)));
    }
  };

  const deleteBatch = async (id: string) => {
    if (!window.confirm("Delete this batch?")) return;
    try {
      await inventoryService.deleteBatch(id);
      await inventoryQuery.refetch();
    } catch (err: any) {
      alert("Failed to delete batch: " + (err.message || String(err)));
    }
  };

  const exportInventory = () => {
    exportToExcel(
      filteredItems.map((item) => ({
        BatchCode: item.batch_code,
        Product: item.product_name,
        Category: item.category,
        Location: item.location_code,
        Quantity: item.quantity,
        CostPerUnit: item.cost,
        ExpiryDate: item.expiry_date,
        Status: item.status,
      })),
      "inventory",
      "Inventory",
    );
  };

  const Pagination = ({
    page,
    totalPages,
    onPrevious,
    onNext,
  }: {
    page: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
  }) => (
    <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
      <p>
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary px-3 py-2"
          onClick={onPrevious}
          disabled={page <= 1}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="btn-secondary px-3 py-2"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderTable = (
    title: string,
    rows: typeof finishedItems,
    page: number,
    totalPages: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
  ) => (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        <span className="text-sm text-text-secondary">
          {rows.length} records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                Batch
              </th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                Product
              </th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                Location
              </th>
              <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                Qty
              </th>
              <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                Cost/Unit
              </th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                Expiry
              </th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                Status
              </th>
              <th className="text-center py-3 px-4 font-semibold text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border hover:bg-background"
              >
                <td className="py-3 px-4 font-medium text-primary">
                  {item.batch_code}
                </td>
                <td className="py-3 px-4 text-text">{item.product_name}</td>
                <td className="py-3 px-4 text-text-secondary">
                  {item.location_code}
                </td>
                <td className="py-3 px-4 text-right font-medium">
                  {item.quantity}
                </td>
                <td className="py-3 px-4 text-right">
                  ₹{(item.cost || 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-text-secondary">
                  {item.expiry_date
                    ? new Date(item.expiry_date).toLocaleDateString("en-IN")
                    : "-"}
                </td>
                <td className="py-3 px-4">
                  <span className="border border-border bg-white px-2 py-1 text-xs font-medium text-text-secondary">
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="rounded-md p-1 text-text-secondary hover:bg-background"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1 text-danger hover:bg-background"
                      onClick={() => deleteBatch(item.id)}
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
      <Pagination
        page={page}
        totalPages={totalPages}
        onPrevious={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track stock by product batches"
        action={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={exportInventory}
            >
              Export Excel
            </button>
            <button
              type="button"
              className="btn-primary flex items-center gap-2"
              onClick={openCreate}
            >
              <Plus size={16} />
              Add Batch
            </button>
          </>
        }
      />

      <div className="card">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="flex items-center gap-2 md:col-span-2">
            <Search size={18} className="text-text-secondary" />
            <FormInput
              placeholder="Search batch, product, category, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent"
            />
          </div>
          <FormSelect
            options={[
              { value: "", label: "All Locations" },
              ...locations.map((location) => ({
                value: location.location_code,
                label: location.location_code,
              })),
            ]}
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
          <FormSelect
            options={[
              { value: "", label: "All Statuses" },
              ...Array.from(new Set(items.map((item) => item.status))).map(
                (status) => ({ value: status, label: status }),
              ),
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-2xl bg-border/60"
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="border border-border bg-white p-4 text-sm text-danger">
          Failed to load inventory from Supabase.
        </div>
      ) : (
        <div className="space-y-6">
          {renderTable(
            "Finished Goods",
            paginatedFinishedItems,
            finishedPage,
            finishedTotalPages,
            setFinishedPage,
          )}
          {renderTable(
            "Raw Materials",
            paginatedRawItems,
            rawPage,
            rawTotalPages,
            setRawPage,
          )}
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">
                {editId ? "Edit Batch" : "Add Batch"}
              </h3>
              <button
                className="btn-secondary text-sm"
                onClick={() => setCreateOpen(false)}
              >
                Close
              </button>
            </div>
            <form className="space-y-4" onSubmit={submitBatch}>
              {!editId && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormSelect
                    label="Product"
                    options={products.map((product) => ({
                      value: product.id,
                      label: `${product.product_code} - ${product.name}`,
                    }))}
                    value={form.product_id}
                    onChange={(e) =>
                      setForm({ ...form, product_id: e.target.value })
                    }
                  />
                  <FormSelect
                    label="Location"
                    options={locations.map((location) => ({
                      value: location.id,
                      label: location.location_code,
                    }))}
                    value={form.location_id}
                    onChange={(e) =>
                      setForm({ ...form, location_id: e.target.value })
                    }
                  />
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Batch Code"
                  value={form.batch_code}
                  readOnly={!editId}
                  onChange={(e) =>
                    setForm({ ...form, batch_code: e.target.value })
                  }
                  required
                  helperText={
                    !editId
                      ? "Auto-generated from existing batch codes"
                      : undefined
                  }
                />
                <FormInput
                  label="Quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Cost per Unit"
                  type="number"
                  value={form.cost}
                  onChange={(e) =>
                    setForm({ ...form, cost: Number(e.target.value) })
                  }
                />
                <FormInput
                  label="Expiry Date"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) =>
                    setForm({ ...form, expiry_date: e.target.value })
                  }
                />
              </div>
              <FormSelect
                label="Status"
                options={[
                  { value: "IN_STOCK", label: "IN_STOCK" },
                  { value: "LOW_STOCK", label: "LOW_STOCK" },
                  { value: "EXPIRED", label: "EXPIRED" },
                  { value: "USED", label: "USED" },
                ]}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
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
                  {editId ? "Update Batch" : "Save Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
