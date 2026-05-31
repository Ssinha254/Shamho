import React from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/shared/PageHeader";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import { Search, Eye, Trash2, CheckCircle2 } from "lucide-react";
import { useTransactions } from "../../hooks";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { exportToExcel } from "../../utils/export";
import { transactionsService } from "../../services/transactions.service";

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const transactionsQuery = useTransactions();
  const { data: transactions = [], isLoading, error } = transactionsQuery;
  const [searchTerm, setSearchTerm] = React.useState("");
  const [paymentFilter, setPaymentFilter] = React.useState("");
  const [deliveryFilter, setDeliveryFilter] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectionMode, setSelectionMode] = React.useState(false);

  const filteredTransactions = React.useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          [transaction.bill_no, transaction.member_name]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) &&
          (!paymentFilter || transaction.payment_type === paymentFilter) &&
          (!deliveryFilter || transaction.delivery_status === deliveryFilter),
      ),
    [transactions, searchTerm, paymentFilter, deliveryFilter],
  );

  const filteredIds = React.useMemo(
    () => filteredTransactions.map((transaction) => transaction.id),
    [filteredTransactions],
  );
  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedIds.includes(id));

  const deleteTransaction = async (id: string) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await transactionsService.deleteTransaction(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      await transactionsQuery.refetch();
      alert("Transaction deleted");
    } catch (err: any) {
      alert("Failed to delete transaction: " + (err.message || String(err)));
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    if (
      !window.confirm(`Delete ${selectedIds.length} selected transaction(s)?`)
    )
      return;
    try {
      await transactionsService.deleteTransactions(selectedIds);
      setSelectedIds([]);
      await transactionsQuery.refetch();
      alert("Selected transactions deleted");
    } catch (err: any) {
      alert(
        "Failed to delete selected transactions: " +
          (err.message || String(err)),
      );
    }
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

  const exportTransactions = () => {
    const exportIds =
      selectionMode && selectedIds.length ? selectedIds : filteredIds;
    const exportRows = filteredTransactions.filter((transaction) =>
      exportIds.includes(transaction.id),
    );

    exportToExcel(
      exportRows.map((transaction) => ({
        BillNo: transaction.bill_no,
        Member: transaction.member_name,
        Date: transaction.date,
        Amount: transaction.total,
        Paid: transaction.payment_type === "CREDIT" ? 0 : transaction.total,
        Balance: transaction.payment_type === "CREDIT" ? transaction.total : 0,
        Mode: transaction.payment_type,
        DeliveryStatus: transaction.delivery_status || "DIRECT_PICKUP",
      })),
      "transactions",
      "Transactions",
    );
  };

  const startSelection = () => {
    setSelectionMode(true);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const confirmDelivery = async (
    transactionId: string,
    truckDriverId: string,
    otp: string,
  ) => {
    if (!truckDriverId) {
      alert("Truck driver not available in this transaction metadata.");
      return;
    }

    try {
      await transactionsService.confirmDelivery(
        transactionId,
        truckDriverId,
        otp,
      );
      await transactionsQuery.refetch();
      alert("Delivery confirmed");
    } catch (err: any) {
      alert("Failed to confirm delivery: " + (err.message || String(err)));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Sales and billing records"
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
            <button
              type="button"
              className="btn-secondary"
              onClick={exportTransactions}
            >
              {selectionMode && selectedIds.length
                ? "Export Selected"
                : "Export Excel"}
            </button>
          </>
        }
      />

      <div className="card">
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <div className="flex items-center gap-2 md:col-span-3">
            <Search size={18} className="text-text-secondary" />
            <FormInput
              placeholder="Search bill number or member name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent"
            />
          </div>
          <FormSelect
            options={[
              { value: "", label: "All Payment Modes" },
              ...Array.from(
                new Set(
                  transactions
                    .map((transaction) => transaction.payment_type)
                    .filter(Boolean),
                ),
              ).map((mode) => ({
                value: mode as string,
                label: mode as string,
              })),
            ]}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          />
          <FormSelect
            options={[
              { value: "", label: "All Delivery" },
              { value: "DIRECT_PICKUP", label: "Direct Pickup" },
              { value: "DELIVERY_PENDING", label: "Pending Delivery" },
              { value: "DELIVERED", label: "Delivered" },
            ]}
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
          />
        </div>

        {isLoading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : error ? (
          <div className="border border-border bg-white p-4 text-sm text-danger">
            Failed to load transactions from Supabase.
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="border border-border bg-white p-6 text-sm text-text-secondary">
            No transactions found.
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
                    Bill No
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Member
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                    Total
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                    Paid
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                    Balance
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Payment
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Delivery
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border hover:bg-background"
                  >
                    {selectionMode && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(transaction.id)}
                          onChange={() => toggleSelectOne(transaction.id)}
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 text-primary font-medium">
                      {transaction.bill_no}
                    </td>
                    <td className="py-3 px-4 text-text">
                      {transaction.member_name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(transaction.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      ₹{transaction.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-success font-medium">
                      ₹
                      {(transaction.payment_type === "CREDIT"
                        ? 0
                        : transaction.total
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-danger font-medium">
                      ₹
                      {(transaction.payment_type === "CREDIT"
                        ? transaction.total
                        : 0
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {transaction.payment_type}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {transaction.delivery_status || "DIRECT_PICKUP"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="rounded-md p-1 text-text-secondary hover:bg-background"
                          onClick={() =>
                            navigate(`/transactions/${transaction.id}`)
                          }
                        >
                          <Eye size={15} />
                        </button>
                        {transaction.delivery_status === "DELIVERY_PENDING" && (
                          <button
                            type="button"
                            className="rounded-md p-1 text-success hover:bg-background"
                            onClick={() =>
                              confirmDelivery(
                                transaction.id,
                                transaction.truck_driver_id || "",
                                transaction.delivery_otp || "",
                              )
                            }
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        {selectionMode && (
                          <button
                            type="button"
                            className="rounded-md p-1 text-danger hover:bg-background"
                            onClick={() => deleteTransaction(transaction.id)}
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
    </div>
  );
};
