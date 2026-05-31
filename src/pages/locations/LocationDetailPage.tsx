import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/shared/PageHeader";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import { SearchableSelect } from "../../components/forms/SearchableSelect";
import {
  useInventory,
  useLocations,
  useMembers,
  useProducts,
  useTechnicians,
} from "../../hooks";
import { inventoryService } from "../../services/inventory.service";
import { deliveryService } from "../../services/delivery.service";
import { transactionsService } from "../../services/transactions.service";
import { aiService } from "../../services/ai.service";
import { generateNextBatchCode } from "../../utils/batch-code";
import { downloadBillPdf } from "../../utils/bill-pdf";

const isRawMaterial = (category: string) => {
  const normalized = category.toUpperCase();
  return normalized.includes("RAW") || normalized.includes("MATERIAL");
};

export const LocationDetailPage: React.FC = () => {
  const { identifier = "" } = useParams();
  const navigate = useNavigate();
  const locationsQuery = useLocations();
  const inventoryQuery = useInventory();
  const productsQuery = useProducts();
  const membersQuery = useMembers();
  const techniciansQuery = useTechnicians();

  const { data: locations = [], isLoading: locationsLoading } = locationsQuery;
  const {
    data: inventory = [],
    isLoading: inventoryLoading,
    error,
  } = inventoryQuery;
  const { data: products = [] } = productsQuery;
  const { data: members = [] } = membersQuery;
  const { data: technicians = [] } = techniciansQuery;

  const location = useMemo(() => {
    const key = identifier.trim().toLowerCase();
    return locations.find(
      (item) =>
        item.id.toLowerCase() === key ||
        item.location_code.toLowerCase() === key,
    );
  }, [locations, identifier]);

  const batches = useMemo(() => {
    const key = identifier.trim().toLowerCase();
    return inventory.filter(
      (batch) =>
        batch.location_id.toLowerCase() === key ||
        batch.location_code.toLowerCase() === key ||
        (location ? batch.location_code === location.location_code : false),
    );
  }, [inventory, identifier, location]);

  const finishedBatches = useMemo(
    () => batches.filter((batch) => !isRawMaterial(batch.category)),
    [batches],
  );
  const sellBatches = finishedBatches;
  const rawBatches = useMemo(
    () => batches.filter((batch) => isRawMaterial(batch.category)),
    [batches],
  );

  const truckDrivers = useMemo(
    () => technicians.filter((tech) => tech.role === "TRUCK_DRIVER"),
    [technicians],
  );

  const technicianOptions = useMemo(
    () =>
      technicians.map((tech) => ({
        value: tech.id,
        label: `${tech.technician_code || "TECH"} - ${tech.name}${tech.role ? ` (${tech.role})` : ""}`,
      })),
    [technicians],
  );

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: `${product.product_code} - ${product.name}${product.category ? ` (${product.category})` : ""}`,
      })),
    [products],
  );

  const nextBatchCode = useMemo(
    () => generateNextBatchCode(inventory.map((batch) => batch.batch_code)),
    [inventory],
  );

  const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);

  const [modal, setModal] = useState<
    null | "add" | "sell" | "consume" | "damage" | "return" | "ai"
  >(null);
  const [addForm, setAddForm] = useState({
    batch_code: "",
    product_id: "",
    quantity: 0,
    cost: "",
    expiry_date: "",
    technician_id: "",
  });
  const [sellForm, setSellForm] = useState({
    member_id: "",
    batch_id: "",
    quantity: 0,
    unit_price: 0,
    payment_type: "CASH",
    delivery_mode: "DIRECT_PICKUP",
    truck_driver_id: "",
    technician_id: "",
  });
  const [consumeForm, setConsumeForm] = useState({
    batch_id: "",
    quantity: 0,
    purpose: "",
    technician_id: "",
  });
  const [damageForm, setDamageForm] = useState({
    batch_id: "",
    quantity: 0,
    reason: "",
    technician_id: "",
  });
  const [returnForm, setReturnForm] = useState({
    batch_id: "",
    quantity: 0,
    technician_id: "",
  });
  const [aiForm, setAiForm] = useState({
    member_id: "",
    animal_id: "",
    semen_batch_id: "",
    technician_id: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const closeModal = () => setModal(null);

  const refresh = async () => {
    await Promise.all([
      locationsQuery.refetch(),
      inventoryQuery.refetch(),
      membersQuery.refetch(),
      techniciansQuery.refetch(),
    ]);
  };

  const submitAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await inventoryService.createBatch({
        batch_code: addForm.batch_code,
        product_id: addForm.product_id,
        location_id: location?.id || identifier,
        quantity: Number(addForm.quantity),
        cost_per_unit: addForm.cost ? Number(addForm.cost) : undefined,
        expiry_date: addForm.expiry_date || null,
      });
      closeModal();
      await refresh();
      alert("Stock added");
    } catch (err: any) {
      alert("Failed to add stock: " + (err.message || String(err)));
    }
  };

  const selectedSellBatch = useMemo(
    () => sellBatches.find((batch) => batch.id === sellForm.batch_id),
    [sellBatches, sellForm.batch_id],
  );

  const sellTotalPrice = useMemo(
    () => sellForm.quantity * sellForm.unit_price,
    [sellForm.quantity, sellForm.unit_price],
  );

  const applyProductSuggestion = (productId: string) => {
    const matchedProduct = products.find((product) => product.id === productId);
    const matchedBatch = batches.find(
      (batch) => batch.product_name === matchedProduct?.name,
    );

    setAddForm((current) => ({
      ...current,
      product_id: productId,
      batch_code: matchedBatch?.batch_code || current.batch_code,
      cost: String(matchedBatch?.cost || current.cost || ""),
      expiry_date: matchedBatch?.expiry_date || current.expiry_date,
    }));
  };

  const submitSellFinished = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const selectedFinishedBatch = sellBatches.find(
        (batch) => batch.id === sellForm.batch_id,
      );

      if (!selectedFinishedBatch) {
        throw new Error("Select a finished goods batch.");
      }

      const deliveryRemarks =
        sellForm.delivery_mode === "TRUCK_DELIVERY"
          ? `DELIVERY_PENDING|driver:${sellForm.truck_driver_id}|location:${location?.location_code || identifier}`
          : "DIRECT_PICKUP";

      const selectedTechnician = technicians.find(
        (tech) => tech.id === sellForm.technician_id,
      );

      if (!selectedTechnician) {
        throw new Error("Select a technician.");
      }

      const createdTransaction = await transactionsService.createTransaction({
        memberId: sellForm.member_id,
        technicianId: selectedTechnician.id,
        technicianName: selectedTechnician.name,
        paymentType: sellForm.payment_type as any,
        remarks: deliveryRemarks,
        items: [
          {
            batch_id: selectedFinishedBatch.id,
            quantity: sellForm.quantity,
            unit_price: sellForm.unit_price,
          } as any,
        ],
      });

      // after creating transaction we also download the bill
      const selectedMember = members.find(
        (member) => member.id === sellForm.member_id,
      );

      downloadBillPdf({
        billNo: createdTransaction.bill_no,
        date: new Date().toLocaleDateString(),
        memberName:
          selectedMember?.name ||
          createdTransaction.member_name ||
          "Unknown Member",
        memberCode: selectedMember?.member_code,
        technicianName: selectedTechnician.name,
        paymentType: sellForm.payment_type,
        items: [
          {
            batchCode: selectedFinishedBatch.batch_code,
            productName: selectedFinishedBatch.product_name,
            quantity: sellForm.quantity,
            unitPrice: sellForm.unit_price,
            total: sellForm.quantity * sellForm.unit_price,
          },
        ],
        grandTotal: sellForm.quantity * sellForm.unit_price,
        deliveryMode: sellForm.delivery_mode,
        driverName:
          sellForm.delivery_mode === "TRUCK_DELIVERY"
            ? truckDrivers.find(
                (driver) => driver.id === sellForm.truck_driver_id,
              )?.name || ""
            : "",
        locationCode: location?.location_code || identifier,
      });

      if (sellForm.delivery_mode === "TRUCK_DELIVERY") {
        await deliveryService.sendDeliveryOtp(createdTransaction.id);
      }

      closeModal();
      await refresh();
      alert("Finished goods billing recorded");
    } catch (err: any) {
      alert("Failed to create bill: " + (err.message || String(err)));
    }
  };

  const submitConsumeRaw = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await inventoryService.damageStock(
        consumeForm.batch_id,
        consumeForm.quantity,
      );
      closeModal();
      await refresh();
      alert("Raw material consumption recorded and stock reduced");
    } catch (err: any) {
      alert("Failed to consume raw material: " + (err.message || String(err)));
    }
  };

  const submitDamage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await inventoryService.damageStock(
        damageForm.batch_id,
        damageForm.quantity,
      );
      closeModal();
      await refresh();
      alert("Damage recorded");
    } catch (err: any) {
      alert("Failed to record damage: " + (err.message || String(err)));
    }
  };

  const submitReturn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await inventoryService.returnStock(
        returnForm.batch_id,
        returnForm.quantity,
      );
      closeModal();
      await refresh();
      alert("Return recorded");
    } catch (err: any) {
      alert("Failed to process return: " + (err.message || String(err)));
    }
  };

  const submitAI = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await aiService.createAIRecord({
        member_id: aiForm.member_id,
        animal_id: aiForm.animal_id,
        semen_batch_id: aiForm.semen_batch_id,
        technician_id: aiForm.technician_id || undefined,
        date: aiForm.date,
        pregnancy_status: "PENDING",
      } as any);
      closeModal();
      await refresh();
      alert("AI usage recorded");
    } catch (err: any) {
      alert("Failed to create AI usage: " + (err.message || String(err)));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Location ${location?.location_code || identifier}`}
        description={location?.remarks || "QR location operations"}
        action={
          <button className="btn-primary" onClick={() => navigate(-1)}>
            Back
          </button>
        }
      />

      {locationsLoading || inventoryLoading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          Failed to load location inventory.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-text-secondary">
                Location
              </p>
              <p className="mt-2 text-2xl font-bold text-text">
                {location?.location_code || identifier}
              </p>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-text-secondary">
                Total Stock
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {totalStock}
              </p>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-text-secondary">
                Batches
              </p>
              <p className="mt-2 text-2xl font-bold text-text">
                {batches.length}
              </p>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                className="btn-primary"
                onClick={() => {
                  setAddForm((current) => ({
                    ...current,
                    batch_code: nextBatchCode,
                  }));
                  setModal("add");
                }}
              >
                Add Stock
              </button>
              <button
                className="btn-secondary"
                onClick={() => setModal("sell")}
              >
                Sell Finished Goods
              </button>
              <button
                className="btn-secondary"
                onClick={() => setModal("consume")}
              >
                Consume Raw Material
              </button>
              <button
                className="btn-secondary"
                onClick={() => setModal("return")}
              >
                Return
              </button>
              <button
                className="btn-secondary"
                onClick={() => setModal("damage")}
              >
                Damage
              </button>
              <button className="btn-secondary" onClick={() => setModal("ai")}>
                AI Usage
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold text-text">
              Finished Goods
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-text-secondary">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                      Expiry
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-text-secondary">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finishedBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="border-b border-border hover:bg-background"
                    >
                      <td className="px-4 py-3 text-text">
                        {batch.product_name}
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">
                        {batch.batch_code}
                      </td>
                      <td className="px-4 py-3 text-right text-text font-medium">
                        {batch.quantity}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {batch.expiry_date || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={batch.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold text-text">
              Raw Materials
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                      Material
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-text-secondary">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">
                      Expiry
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-text-secondary">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rawBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="border-b border-border hover:bg-background"
                    >
                      <td className="px-4 py-3 text-text">
                        {batch.product_name}
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">
                        {batch.batch_code}
                      </td>
                      <td className="px-4 py-3 text-right text-text font-medium">
                        {batch.quantity}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {batch.expiry_date || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={batch.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {modal === "add" && "Add Stock"}
                {modal === "sell" && "Sell Finished Goods"}
                {modal === "consume" && "Consume Raw Material"}
                {modal === "damage" && "Damage Stock"}
                {modal === "return" && "Return Stock"}
                {modal === "ai" && "AI Usage"}
              </h3>
            </div>

            {modal === "add" && (
              <form onSubmit={submitAdd} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="w-full">
                    <FormInput
                      label="Batch Code"
                      value={addForm.batch_code}
                      readOnly
                      required
                      helperText="Auto-generated from existing batch codes"
                    />
                  </div>
                  <FormInput
                    label="Quantity"
                    type="number"
                    value={addForm.quantity}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        quantity: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormSelect
                    label="Product"
                    value={addForm.product_id}
                    placeholder="Select product"
                    options={productOptions}
                    onChange={(e) => applyProductSuggestion(e.target.value)}
                  />
                  <FormInput
                    label="Cost per Unit"
                    type="number"
                    value={addForm.cost}
                    onChange={(e) =>
                      setAddForm({ ...addForm, cost: e.target.value })
                    }
                  />
                </div>
                <FormSelect
                  label="Technician"
                  value={addForm.technician_id}
                  placeholder="Select technician"
                  options={technicianOptions}
                  onChange={(e) =>
                    setAddForm({ ...addForm, technician_id: e.target.value })
                  }
                />
                <FormInput
                  label="Expiry Date"
                  type="date"
                  value={addForm.expiry_date}
                  onChange={(e) =>
                    setAddForm({ ...addForm, expiry_date: e.target.value })
                  }
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                </div>
              </form>
            )}

            {modal === "sell" && (
              <form onSubmit={submitSellFinished} className="space-y-3">
                <SearchableSelect
                  label="Member"
                  value={sellForm.member_id}
                  placeholder="Select member"
                  options={members.map((member) => ({
                    value: member.id,
                    label: `${member.member_code} - ${member.name}${member.village ? ` (${member.village})` : ""}`,
                  }))}
                  onValueChange={(memberId) =>
                    setSellForm({ ...sellForm, member_id: memberId })
                  }
                />
                <FormSelect
                  label="Technician"
                  value={sellForm.technician_id}
                  placeholder="Select technician"
                  options={technicians.map((tech) => ({
                    value: tech.id,
                    label: `${tech.technician_code || "TECH"} - ${tech.name}${tech.role ? ` (${tech.role})` : ""}`,
                  }))}
                  onChange={(e) =>
                    setSellForm({ ...sellForm, technician_id: e.target.value })
                  }
                />
                <FormSelect
                  label="Finished Goods Batch"
                  value={sellForm.batch_id}
                  placeholder="Select finished goods batch"
                  options={sellBatches.map((batch) => ({
                    value: batch.id,
                    label: `${batch.batch_code} - ${batch.product_name} | Qty: ${batch.quantity} | Price: ₹${(batch.cost || 0).toLocaleString()}`,
                  }))}
                  onChange={(e) =>
                    setSellForm((current) => {
                      const batch = sellBatches.find(
                        (item) => item.id === e.target.value,
                      );
                      return {
                        ...current,
                        batch_id: e.target.value,
                        quantity: current.quantity || 1,
                        unit_price: batch?.cost || current.unit_price,
                      };
                    })
                  }
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormInput
                    label="Quantity"
                    type="number"
                    value={sellForm.quantity}
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        quantity: Number(e.target.value),
                      })
                    }
                    required
                  />
                  <FormInput
                    label="Unit Price"
                    type="number"
                    value={sellForm.unit_price}
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        unit_price: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <FormInput
                  label="Total Price"
                  type="number"
                  value={sellTotalPrice}
                  readOnly
                  helperText={
                    selectedSellBatch
                      ? `Calculated as ${sellForm.quantity || 0} × ₹${(sellForm.unit_price || 0).toLocaleString()}`
                      : "Select a batch and enter quantity to calculate total price"
                  }
                />
                {sellBatches.length === 0 && (
                  <p className="text-sm text-danger">
                    No finished-goods batches available at this location.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormSelect
                    label="Payment Type"
                    value={sellForm.payment_type}
                    placeholder="Select payment type"
                    options={[
                      { value: "CASH", label: "Cash" },
                      { value: "CREDIT", label: "Credit" },
                    ]}
                    onChange={(e) =>
                      setSellForm({ ...sellForm, payment_type: e.target.value })
                    }
                  />
                  <FormSelect
                    label="Pickup Mode"
                    value={sellForm.delivery_mode}
                    placeholder="Select pickup mode"
                    options={[
                      { value: "DIRECT_PICKUP", label: "Direct Pickup" },
                      { value: "TRUCK_DELIVERY", label: "Truck Delivery" },
                    ]}
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        delivery_mode: e.target.value,
                      })
                    }
                  />
                </div>
                {sellForm.delivery_mode === "TRUCK_DELIVERY" && (
                  <FormSelect
                    label="Truck Driver"
                    value={sellForm.truck_driver_id}
                    placeholder="Select truck driver"
                    options={truckDrivers.map((driver) => ({
                      value: driver.id,
                      label: `${driver.technician_code} - ${driver.name}`,
                    }))}
                    onChange={(e) =>
                      setSellForm({
                        ...sellForm,
                        truck_driver_id: e.target.value,
                      })
                    }
                  />
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Bill
                  </button>
                </div>
              </form>
            )}

            {modal === "consume" && (
              <form onSubmit={submitConsumeRaw} className="space-y-3">
                <FormSelect
                  label="Raw Material Batch"
                  value={consumeForm.batch_id}
                  options={rawBatches.map((batch) => ({
                    value: batch.id,
                    label: `${batch.batch_code} - ${batch.product_name} (Stock: ${batch.quantity})`,
                  }))}
                  onChange={(e) =>
                    setConsumeForm({ ...consumeForm, batch_id: e.target.value })
                  }
                />
                <FormInput
                  label="Consumed Quantity"
                  type="number"
                  value={consumeForm.quantity}
                  onChange={(e) =>
                    setConsumeForm({
                      ...consumeForm,
                      quantity: Number(e.target.value),
                    })
                  }
                  required
                />
                <FormInput
                  label="Purpose"
                  value={consumeForm.purpose}
                  onChange={(e) =>
                    setConsumeForm({ ...consumeForm, purpose: e.target.value })
                  }
                />
                <FormSelect
                  label="Technician"
                  value={consumeForm.technician_id}
                  placeholder="Select technician"
                  options={technicianOptions}
                  onChange={(e) =>
                    setConsumeForm({
                      ...consumeForm,
                      technician_id: e.target.value,
                    })
                  }
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Consume
                  </button>
                </div>
              </form>
            )}

            {modal === "damage" && (
              <form onSubmit={submitDamage} className="space-y-3">
                <FormSelect
                  label="Batch"
                  value={damageForm.batch_id}
                  options={batches.map((batch) => ({
                    value: batch.id,
                    label: `${batch.batch_code} - ${batch.product_name}`,
                  }))}
                  onChange={(e) =>
                    setDamageForm({ ...damageForm, batch_id: e.target.value })
                  }
                />
                <FormInput
                  label="Damaged Quantity"
                  type="number"
                  value={damageForm.quantity}
                  onChange={(e) =>
                    setDamageForm({
                      ...damageForm,
                      quantity: Number(e.target.value),
                    })
                  }
                  required
                />
                <FormInput
                  label="Reason"
                  value={damageForm.reason}
                  onChange={(e) =>
                    setDamageForm({ ...damageForm, reason: e.target.value })
                  }
                />
                <FormSelect
                  label="Technician"
                  value={damageForm.technician_id}
                  placeholder="Select technician"
                  options={technicianOptions}
                  onChange={(e) =>
                    setDamageForm({
                      ...damageForm,
                      technician_id: e.target.value,
                    })
                  }
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                </div>
              </form>
            )}

            {modal === "return" && (
              <form onSubmit={submitReturn} className="space-y-3">
                <FormSelect
                  label="Batch"
                  value={returnForm.batch_id}
                  options={batches.map((batch) => ({
                    value: batch.id,
                    label: `${batch.batch_code} - ${batch.product_name}`,
                  }))}
                  onChange={(e) =>
                    setReturnForm({ ...returnForm, batch_id: e.target.value })
                  }
                />
                <FormInput
                  label="Return Quantity"
                  type="number"
                  value={returnForm.quantity}
                  onChange={(e) =>
                    setReturnForm({
                      ...returnForm,
                      quantity: Number(e.target.value),
                    })
                  }
                  required
                />
                <FormSelect
                  label="Technician"
                  value={returnForm.technician_id}
                  placeholder="Select technician"
                  options={technicianOptions}
                  onChange={(e) =>
                    setReturnForm({
                      ...returnForm,
                      technician_id: e.target.value,
                    })
                  }
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                </div>
              </form>
            )}

            {modal === "ai" && (
              <form onSubmit={submitAI} className="space-y-3">
                <SearchableSelect
                  label="Member"
                  value={aiForm.member_id}
                  placeholder="Select member"
                  options={members.map((member) => ({
                    value: member.id,
                    label: `${member.member_code} - ${member.name}`,
                  }))}
                  onValueChange={(memberId) =>
                    setAiForm({ ...aiForm, member_id: memberId })
                  }
                />
                <FormInput
                  label="Animal ID"
                  value={aiForm.animal_id}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, animal_id: e.target.value })
                  }
                />
                <FormSelect
                  label="Semen Batch"
                  value={aiForm.semen_batch_id}
                  options={finishedBatches.map((batch) => ({
                    value: batch.id,
                    label: `${batch.batch_code} - ${batch.product_name}`,
                  }))}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, semen_batch_id: e.target.value })
                  }
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormSelect
                    label="AI Technician"
                    value={aiForm.technician_id}
                    options={technicians
                      .filter((tech) => tech.role === "AI_TECHNICIAN")
                      .map((tech) => ({
                        value: tech.id,
                        label: `${tech.technician_code} - ${tech.name}`,
                      }))}
                    onChange={(e) =>
                      setAiForm({ ...aiForm, technician_id: e.target.value })
                    }
                  />
                  <FormInput
                    label="Date"
                    type="date"
                    value={aiForm.date}
                    onChange={(e) =>
                      setAiForm({ ...aiForm, date: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationDetailPage;
