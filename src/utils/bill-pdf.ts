type BillItem = {
  batchCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type BillPdfData = {
  billNo: string;
  date: string;
  memberName: string;
  memberCode?: string;
  technicianName: string;
  paymentType: string;
  items: BillItem[];
  grandTotal: number;
  deliveryMode?: string;
  driverName?: string;
  locationCode?: string;
};

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const padRight = (value: string, width: number) => {
  const text = value.length > width ? value.slice(0, Math.max(width - 1, 0)) + "…" : value;
  return text.padEnd(width, " ");
};

const buildRow = (columns: Array<{ value: string; width: number }>) =>
  columns.map((column) => padRight(column.value, column.width)).join(" | ");

const escapePdfText = (value: string) =>
  value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");

const wrapLines = (text: string, maxLength: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
};

const buildPdf = (lines: string[]) => {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginLeft = 40;
  const marginTop = 50;
  const lineHeight = 16;

  const contentLines = [
    "BT",
    "/F1 18 Tf",
    `${marginLeft} ${pageHeight - marginTop} Td`,
    `(${escapePdfText(lines[0] || "SHAMHO Bill")}) Tj`,
    "/F1 11 Tf",
    ...lines.slice(1).flatMap((line, index) => {
      const yOffset = index === 0 ? -30 : -lineHeight;
      return [`0 ${yOffset} Td`, `(${escapePdfText(line)}) Tj`];
    }),
    "ET",
  ].join("\n");

  const objects: string[] = [];
  const addObject = (content: string) => {
    objects.push(content);
    return objects.length;
  };

  const catalog = addObject(`<< /Type /Catalog /Pages 2 0 R >>`);
  const pages = addObject(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  const page = addObject(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
  );
  const font = addObject(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
  );
  const stream = addObject(
    `<< /Length ${contentLines.length} >>\nstream\n${contentLines}\nendstream`,
  );

  const header = "%PDF-1.4\n";
  let output = header;
  const offsets: number[] = [0];

  objects.forEach((obj, index) => {
    offsets.push(output.length);
    output += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    output += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return output;
};

export const downloadBillPdf = (bill: BillPdfData) => {
  const pdfLines: string[] = [
    "SHAMHO Bill",
    `Bill No: ${bill.billNo}`,
    `Date: ${bill.date}`,
    `Member: ${bill.memberName}${bill.memberCode ? ` (${bill.memberCode})` : ""}`,
    `Technician: ${bill.technicianName}`,
    `Payment: ${bill.paymentType}`,
  ];

  if (bill.deliveryMode) pdfLines.push(`Delivery: ${bill.deliveryMode}`);
  if (bill.driverName) pdfLines.push(`Driver: ${bill.driverName}`);
  if (bill.locationCode) pdfLines.push(`Location: ${bill.locationCode}`);

  pdfLines.push("Items");
  pdfLines.push(
    buildRow([
      { value: "#", width: 3 },
      { value: "Batch", width: 14 },
      { value: "Product", width: 28 },
      { value: "Qty", width: 6 },
      { value: "Rate", width: 12 },
      { value: "Total", width: 12 },
    ]),
  );
  pdfLines.push("--------------------------------------------------------------------------");
  bill.items.forEach((item, index) => {
    pdfLines.push(
      buildRow([
        { value: String(index + 1), width: 3 },
        { value: item.batchCode, width: 14 },
        { value: item.productName, width: 28 },
        { value: String(item.quantity), width: 6 },
        { value: money(item.unitPrice), width: 12 },
        { value: money(item.total), width: 12 },
      ]),
    );
  });
  pdfLines.push(`Grand Total: ${money(bill.grandTotal)}`);

  const pdf = buildPdf(pdfLines.flatMap((line) => wrapLines(line, 80)));
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bill-${bill.billNo}.pdf`;
  link.click();
  // keep URL alive briefly to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const openBillPdf = (bill: BillPdfData) => {
  const pdfLines: string[] = [
    "SHAMHO Bill",
    `Bill No: ${bill.billNo}`,
    `Date: ${bill.date}`,
    `Member: ${bill.memberName}${bill.memberCode ? ` (${bill.memberCode})` : ""}`,
    `Technician: ${bill.technicianName}`,
    `Payment: ${bill.paymentType}`,
  ];

  if (bill.deliveryMode) pdfLines.push(`Delivery: ${bill.deliveryMode}`);
  if (bill.driverName) pdfLines.push(`Driver: ${bill.driverName}`);
  if (bill.locationCode) pdfLines.push(`Location: ${bill.locationCode}`);

  pdfLines.push("Items");
  bill.items.forEach((item, index) => {
    pdfLines.push(`${index + 1}. ${item.batchCode} - ${item.productName}`);
    pdfLines.push(
      `   Qty: ${item.quantity}   Rate: ${money(item.unitPrice)}   Total: ${money(item.total)}`,
    );
  });
  pdfLines.push(`Grand Total: ${money(bill.grandTotal)}`);

  const pdf = buildPdf(pdfLines.flatMap((line) => wrapLines(line, 80)));
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    // allow the new tab to load the blob
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  } else {
    // fallback: navigate current window
    window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  }
};
