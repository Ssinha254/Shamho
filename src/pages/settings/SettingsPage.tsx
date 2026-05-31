import React, { useState } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";

export const SettingsPage: React.FC = () => {
  const [orgName, setOrgName] = useState("Dairy Cooperative Ltd");
  const [orgCode, setOrgCode] = useState("DCOOP-001");
  const [paperSize, setPaperSize] = useState("A4");
  const [invoiceLayout, setInvoiceLayout] = useState("detailed");

  const saveSettings = () => {
    localStorage.setItem(
      "shamho-org-settings",
      JSON.stringify({ orgName, orgCode, paperSize, invoiceLayout }),
    );
    alert("Settings saved");
  };

  const updatePrintSettings = () => {
    localStorage.setItem(
      "shamho-print-settings",
      JSON.stringify({ paperSize, invoiceLayout }),
    );
    alert("Print settings updated");
  };

  const exportData = () => {
    const payload = {
      orgName,
      orgCode,
      paperSize,
      invoiceLayout,
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shamho-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Settings"
        description="System configuration and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-text mb-6">
              Organization Settings
            </h3>
            <div className="space-y-4">
              <FormInput
                label="Organization Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <FormInput
                label="Organization Code"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value)}
              />
              <FormInput
                label="Email"
                type="email"
                defaultValue="admin@cooperative.com"
              />
              <FormInput
                label="Phone"
                type="tel"
                defaultValue="+91 9876543210"
              />
              <FormInput
                label="Address"
                defaultValue="Village Nandpur, District Madhya Pradesh"
              />
              <button
                type="button"
                className="btn-primary"
                onClick={saveSettings}
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-text mb-6">
              Printing Settings
            </h3>
            <div className="space-y-4">
              <FormSelect
                label="Paper Size"
                options={[
                  { value: "A4", label: "A4" },
                  { value: "A5", label: "A5" },
                  { value: "thermal", label: "Thermal (80mm)" },
                ]}
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
              />
              <FormSelect
                label="Invoice Layout"
                options={[
                  { value: "detailed", label: "Detailed" },
                  { value: "compact", label: "Compact" },
                  { value: "minimal", label: "Minimal" },
                ]}
                value={invoiceLayout}
                onChange={(e) => setInvoiceLayout(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={updatePrintSettings}
              >
                Update Print Settings
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-text mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-xs text-text-secondary">System Version</p>
                <p className="text-sm font-medium text-text">1.0.0</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-xs text-text-secondary">Last Backup</p>
                <p className="text-sm font-medium text-text">2024-06-10</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-xs text-text-secondary">Users</p>
                <p className="text-sm font-medium text-text">5 Active</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-text mb-4">
              Danger Zone
            </h3>
            <button
              type="button"
              className="w-full px-4 py-2 bg-danger bg-opacity-10 text-danger font-medium hover:bg-opacity-20 transition"
              onClick={exportData}
            >
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
