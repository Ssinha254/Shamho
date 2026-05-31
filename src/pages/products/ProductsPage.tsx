import React, { useMemo, useState } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useProducts } from "../../hooks";
import { productsService } from "../../services/products.service";
import { exportToExcel } from "../../utils/export";

type ProductFormState = {
  product_code: string;
  product_name: string;
  product_category: string;
  unit: string;
};

const emptyForm: ProductFormState = {
  product_code: "",
  product_name: "",
  product_category: "",
  unit: "",
};

export const ProductsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const productsQuery = useProducts();
  const { data: products = [], isLoading, error } = productsQuery;
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          [product.name, product.product_code, product.category, product.unit]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) &&
          (!categoryFilter || product.category === categoryFilter) &&
          (!unitFilter || product.unit === unitFilter),
      ),
    [products, searchTerm, categoryFilter, unitFilter],
  );

  const filteredIds = useMemo(
    () => filteredProducts.map((product) => product.id),
    [filteredProducts],
  );
  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedIds.includes(id));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (product: (typeof products)[number]) => {
    setEditingId(product.id);
    setForm({
      product_code: product.product_code,
      product_name: product.name,
      product_category: product.category || "",
      unit: product.unit || "",
    });
    setCreateOpen(true);
  };

  const submitProduct = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editingId) {
        await productsService.updateProduct(editingId, {
          product_code: form.product_code,
          product_name: form.product_name,
          product_category: form.product_category || null,
          unit: form.unit || null,
        });
        alert("Product updated");
      } else {
        await productsService.createProduct(form);
        alert("Product created");
      }
      setCreateOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await productsQuery.refetch();
    } catch (err: any) {
      alert("Failed to save product: " + (err.message || String(err)));
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await productsService.deleteProduct(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      await productsQuery.refetch();
      alert("Product deleted");
    } catch (err: any) {
      alert("Failed to delete product: " + (err.message || String(err)));
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected product(s)?`))
      return;
    try {
      await productsService.deleteProducts(selectedIds);
      setSelectedIds([]);
      await productsQuery.refetch();
      alert("Selected products deleted");
    } catch (err: any) {
      alert(
        "Failed to delete selected products: " + (err.message || String(err)),
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

  const exportProducts = () => {
    const exportIds =
      selectionMode && selectedIds.length ? selectedIds : filteredIds;
    const exportRows = filteredProducts.filter((product) =>
      exportIds.includes(product.id),
    );

    exportToExcel(
      exportRows.map((product) => ({
        Code: product.product_code,
        Product: product.name,
        Category: product.category || "",
        Unit: product.unit || "",
        Batches: product.batch_count,
        Stock: product.stock_quantity,
      })),
      "products",
      "Products",
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage product inventory and categories"
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
              Add Product
            </button>
          </>
        }
      />

      <div className="card">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="flex items-center gap-2 md:col-span-2">
            <Search size={18} className="text-text-secondary" />
            <FormInput
              placeholder="Search code, name, category, or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent"
            />
          </div>
          <FormSelect
            options={[
              { value: "", label: "All Categories" },
              ...Array.from(
                new Set(
                  products.map((product) => product.category).filter(Boolean),
                ),
              ).map((category) => ({
                value: category as string,
                label: category as string,
              })),
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
          <div className="flex gap-2">
            <FormSelect
              options={[
                { value: "", label: "All Units" },
                ...Array.from(
                  new Set(
                    products.map((product) => product.unit).filter(Boolean),
                  ),
                ).map((unit) => ({
                  value: unit as string,
                  label: unit as string,
                })),
              ]}
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary whitespace-nowrap"
              onClick={exportProducts}
            >
              {selectionMode && selectedIds.length
                ? "Export Selected"
                : "Export Excel"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse bg-border/60"
              ></div>
            ))}
          </div>
        ) : error ? (
          <div className="border border-border bg-white p-4 text-sm text-danger">
            Failed to load products from Supabase.
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
                    Code
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Category
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-text-secondary">
                    Unit
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                    Batches
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                    Stock
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border hover:bg-background"
                  >
                    {selectionMode && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelectOne(product.id)}
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 font-medium text-primary">
                      {product.product_code}
                    </td>
                    <td className="py-3 px-4 text-text">{product.name}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {product.category || "-"}
                    </td>
                    <td className="py-3 px-4 text-center text-text-secondary">
                      {product.unit || "-"}
                    </td>
                    <td className="py-3 px-4 text-right text-text font-medium">
                      {product.batch_count}
                    </td>
                    <td className="py-3 px-4 text-right text-text font-medium">
                      {product.stock_quantity}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="rounded-md p-1 text-text-secondary hover:bg-background"
                          onClick={() => openEdit(product)}
                        >
                          <Pencil size={15} />
                        </button>
                        {selectionMode && (
                          <button
                            type="button"
                            className="rounded-md p-1 text-danger hover:bg-background"
                            onClick={() => deleteProduct(product.id)}
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

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">
                {editingId ? "Edit Product" : "Add Product"}
              </h3>
              <button
                className="btn-secondary text-sm"
                onClick={() => setCreateOpen(false)}
              >
                Close
              </button>
            </div>
            <form className="space-y-4" onSubmit={submitProduct}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Product Code"
                  value={form.product_code}
                  onChange={(e) =>
                    setForm({ ...form, product_code: e.target.value })
                  }
                  required
                />
                <FormInput
                  label="Product Name"
                  value={form.product_name}
                  onChange={(e) =>
                    setForm({ ...form, product_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Category"
                  value={form.product_category}
                  onChange={(e) =>
                    setForm({ ...form, product_category: e.target.value })
                  }
                />
                <FormInput
                  label="Unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
