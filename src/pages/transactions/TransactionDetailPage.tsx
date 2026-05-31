import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTransactionDetails, useTransactions } from "../../hooks";
import { PageHeader } from "../../components/shared/PageHeader";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { FormInput } from "../../components/forms/FormInput";
import { useAuth } from "../../providers/AuthProvider";
import { transactionsService } from "../../services/transactions.service";
import { CheckCircle2, Circle, MapPin, Package, Truck } from "lucide-react";

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: rows = [], isLoading, error } = useTransactionDetails(id || "");
  const { data: transactions = [] } = useTransactions();
  const [enteredOtp, setEnteredOtp] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);

  const tx = rows[0];
  const masterTransaction = transactions.find(
    (transaction) => transaction.id === id,
  );

  const handleConfirmDelivery = async () => {
    if (!id || !masterTransaction?.truck_driver_id) return;

    if (
      masterTransaction.delivery_otp &&
      enteredOtp !== masterTransaction.delivery_otp
    ) {
      alert("OTP does not match.");
      return;
    }

    try {
      setConfirming(true);
      await transactionsService.confirmDelivery(
        id,
        masterTransaction.truck_driver_id,
        masterTransaction.delivery_otp || enteredOtp,
      );
      await Promise.all([
        transactionsService.getTransactionById(id),
        transactionsService.getTransactions(),
      ]);
      alert("Delivery marked as confirmed.");
      navigate(0);
    } catch (err: any) {
      alert("Failed to confirm delivery: " + (err.message || String(err)));
    } finally {
      setConfirming(false);
    }
  };

  const showDeliveryPanel =
    user?.role === "TRUCK_DRIVER" &&
    masterTransaction?.delivery_status === "DELIVERY_PENDING";

  const deliveryState = masterTransaction?.delivery_status || "DIRECT_PICKUP";
  const deliverySteps = [
    {
      key: "packed",
      label: "Packed",
      description: "Items are prepared at the warehouse",
      active: true,
      icon: Package,
    },
    {
      key: "in_transit",
      label: "In Transit",
      description: "Truck driver is carrying the delivery",
      active: deliveryState !== "DIRECT_PICKUP",
      icon: Truck,
    },
    {
      key: "delivered",
      label: "Delivered",
      description: "Farmer confirms receipt with OTP",
      active: deliveryState === "DELIVERED",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Transaction ${tx?.transaction_code || ""}`}
        description={`Details for transaction ${tx?.transaction_code || ""}`}
        action={
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        }
      />

      {showDeliveryPanel && (
        <div className="card space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-text">Delivery Flow</h3>
            <p className="text-sm text-text-secondary">
              Use the farmer OTP to confirm delivery for this transaction.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-gradient-to-r from-primary-dark via-primary to-emerald-700 p-4 text-white shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              {deliverySteps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === deliverySteps.length - 1;
                return (
                  <div
                    key={step.key}
                    className="relative flex items-start gap-3"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={[
                          "flex h-11 w-11 items-center justify-center rounded-full border-2",
                          step.active
                            ? "border-white bg-white text-primary"
                            : "border-white/40 bg-white/10 text-white/70",
                        ].join(" ")}
                      >
                        <Icon size={18} />
                      </div>
                      {!isLast && (
                        <div className="mt-2 h-16 w-px bg-white/30 md:hidden"></div>
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-semibold">{step.label}</p>
                      <p className="text-xs text-white/75">
                        {step.description}
                      </p>
                    </div>
                    {!isLast && (
                      <div className="absolute left-6 top-5 hidden h-px w-[calc(100%-3rem)] bg-white/20 md:block"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-text-secondary">
                Delivery OTP
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {masterTransaction?.delivery_otp || "Not generated"}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Shared with the farmer when the truck leaves for delivery.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text">
                <MapPin size={16} className="text-primary" />
                <span>Confirm handoff</span>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Enter the OTP received by the farmer to finish the delivery
                flow.
              </p>
              <div className="mt-4 space-y-3">
                <FormInput
                  label="Enter OTP"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Ask farmer for OTP"
                />
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Circle size={12} />
                  <span>Status: {deliveryState.replaceAll("_", " ")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              className="btn-primary"
              type="button"
              disabled={confirming}
              onClick={handleConfirmDelivery}
            >
              {confirming ? "Confirming..." : "Confirm Delivery"}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <LoadingSkeleton type="table" count={3} />
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
            Failed to load transaction.
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-4">
              <div className="text-sm text-text-secondary">Member</div>
              <div className="text-lg font-medium">{tx?.member_name}</div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Batch
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">
                    Product
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                    Qty
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                    Rate
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((it) => (
                  <tr
                    key={`${it.transaction_id}-${it.batch_code}`}
                    className="border-b border-border hover:bg-background"
                  >
                    <td className="py-3 px-4 font-medium text-primary">
                      {it.batch_code}
                    </td>
                    <td className="py-3 px-4 text-text">{it.product_name}</td>
                    <td className="py-3 px-4 text-right">{it.quantity}</td>
                    <td className="py-3 px-4 text-right">₹{it.rate}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      ₹{it.total_price}
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

export default TransactionDetailPage;
