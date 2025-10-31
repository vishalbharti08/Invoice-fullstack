import { useEffect, useState } from "react";
import Loader from "./Loader/Loader";

const VendorInbox = ({
  inbox,
  setInbox,
  reuploadFiles,
  setReuploadFiles,
  fetchInbox,
  handleReupload,
  uploadingInvoiceId,
}) => {
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {inbox.length === 0 ? (
        <p className="text-gray-500">No remarks available yet.</p>
      ) : (
        inbox.map((item, index) => (
          <div
            key={item.id}
            className="border rounded-lg shadow-sm overflow-hidden"
          >
            {/* === Dropdown Header === */}
            <div
              onClick={() => toggleDropdown(index)}
              className="flex justify-between items-center bg-gray-100 px-4 py-3 cursor-pointer hover:bg-gray-200 transition"
            >
              <div>
                <h3 className="font-semibold text-gray-800">
                  {/* {item.name || "Unnamed Vendor"} ({item.id}) */}
                  GST Number: {item.gst_number}
                </h3>
                <p className="text-sm text-gray-500">
                  Remark: {item.remark || "No remark"}
                </p>
              </div>
              <span
                className={`transform transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </div>

            {/* === Dropdown Content === */}
            {openIndex === index && (
              <div className="p-4 space-y-4 bg-white animate-fadeIn">
                {/* Vendor Information */}
                <section>
                  <h4 className="font-medium mb-2 border-b pb-1">
                    Vendor Information
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      ["Vendor Code", item.id],
                      ["Vendor Name", item.name],
                      ["Vendor Address", item.address],
                      ["Vendor State", item.state],
                      ["GST Number", item.gst_number],
                      ["PAN Number", item.pan],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <label className="text-sm font-medium">{label}</label>
                        <input
                          type="text"
                          readOnly
                          value={value || ""}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* TIL Details */}
                <section>
                  <h4 className="font-medium mb-2 border-b pb-1">
                    TIL’s Own Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      ["TIL Billing Location", "billing_location_til"],
                      ["TIL Billing Address", "til_billing_address"],
                      ["TIL State", "til_state"],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <label className="text-sm font-medium">{label}</label>
                        <input
                          type="text"
                          value={item[key] || ""}
                          onChange={(e) =>
                            setInbox((prev) =>
                              prev.map((inv) =>
                                inv.id === item.id
                                  ? { ...inv, [key]: e.target.value }
                                  : inv
                              )
                            )
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Purchase Order Details */}
                <section>
                  <h4 className="font-medium mb-2 border-b pb-1">
                    Purchase Order Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      ["PO Number", "po_number"],
                      ["PO Date", "po_date", "date"],
                      ["Cost Center", "cost_center"],
                      ["HSN/SAC Code", "sac_code"],
                      ["Service/Goods Description", "service_desc"],
                      ["Taxable Amount", "taxable_amt"],
                      ["GST Rate", "gst_rate"],
                      ["CGST", "cgst"],
                      ["SGST", "sgst"],
                      ["IGST", "igst"],
                      ["Place of Supply", "supply_place"],
                      ["Business Name", "business_name"],
                    ].map(([label, key, type]) => (
                      <div key={key}>
                        <label className="text-sm font-medium">{label}</label>
                        <input
                          type={type || "text"}
                          value={item[key] || ""}
                          onChange={(e) =>
                            setInbox((prev) =>
                              prev.map((inv) =>
                                inv.id === item.id
                                  ? { ...inv, [key]: e.target.value }
                                  : inv
                              )
                            )
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* PDF Links */}
                <section className="space-y-2">
                  {["po_pdf", "invoice_pdf"].map((key) => (
                    <div key={key}>
                      <p className="font-medium text-gray-700 capitalize">
                        {key.replace("_", " ")} Files:
                      </p>
                      {Array.isArray(item.pdfs?.[key]) &&
                      item.pdfs[key].length > 0 ? (
                        <ul className="list-disc list-inside">
                          {item.pdfs[key].map((url, idx) => (
                            <li key={idx}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline"
                              >
                                View {key.replace("_", " ")} {idx + 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">
                          No {key.replace("_", " ")} files uploaded.
                        </p>
                      )}
                    </div>
                  ))}
                </section>

                {/* File Uploads */}
                <section className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">Upload PO PDF</label>
                    <input
                      type="file"
                      multiple
                      accept="application/pdf"
                      onChange={(e) =>
                        setReuploadFiles((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...(prev[item.id] || {}),
                            po_pdf: Array.from(e.target.files),
                          },
                        }))
                      }
                      className="block w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="font-medium">Upload Invoice PDF</label>
                    <input
                      type="file"
                      multiple
                      accept="application/pdf"
                      onChange={(e) =>
                        setReuploadFiles((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...(prev[item.id] || {}),
                            invoice_pdf: Array.from(e.target.files),
                          },
                        }))
                      }
                      className="block w-full mt-1"
                    />
                  </div>
                </section>

                {/* Upload Button */}
                <div className="mt-3">
                  {uploadingInvoiceId === item.id ? (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                      <Loader />
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const { pdfs: _unused, ...cleanedItem } = item;
                        handleReupload(
                          item.id,
                          reuploadFiles[item.id],
                          cleanedItem
                        );
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Upload Corrected Files
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default VendorInbox;
