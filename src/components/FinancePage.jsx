import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import { useAuthCheck } from "../hooks/useAuthCheck";
import axios from "axios";
import { toast } from "react-toastify";
import Loader from "./Loader/Loader";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";

const TABS = {
  pending: "Pending",
  changes_requested: "Changes Requested",
  sent_for_payment: "Sent for Payment",
};

const FinancePage = () => {
  useAuthCheck();
  const [invoices, setInvoices] = useState([]);
  const [remark, setRemark] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [expandedDate, setExpandedDate] = useState(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();
  const JwtToken = localStorage.getItem("token");

  const fetchInvoices = async (status) => {
    try {
      const res = await axios.get(`${config.BASE_URL}/invoices`, {
        params: { status },
      });
      setInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      toast.error("Failed to fetch invoices.");
    }
  };

  useEffect(() => {
    fetchInvoices(activeTab);
    setExpandedDate(null);
    setExpandedInvoiceId(null);
    setSelectedInvoice(null);
    setRemark("");
  }, [activeTab]);

  const handleSendRemark = async () => {
    if (!selectedInvoice)
      return toast.warning("Please select an invoice first.");
    if (!remark.trim()) return toast.warning("Please enter a remark.");

    setLoading(true);
    try {
      const pdfsPayload = {
        po_pdf: selectedInvoice?.pdfs?.po_pdf || [],
        invoice_pdf: selectedInvoice?.pdfs?.invoice_pdf || [],
      };

      await axios.post(
        `${config.BASE_URL}/remark/${selectedInvoice.id}`,
        { remark, pdfs: pdfsPayload },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${JwtToken}`,
          },
        }
      );

      toast.success("Remark sent to vendor");
      setRemark("");
      setSelectedInvoice(null);
      fetchInvoices(activeTab);
    } catch (error) {
      console.error("Error sending remark:", error);
      toast.error("Failed to send remark.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendForPayment = async () => {
    if (!selectedInvoice)
      return toast.warning("Please select an invoice first.");

    setLoading(true);
    try {
      await axios.post(
        `${config.BASE_URL}/send-for-payment/${selectedInvoice.id}`,
        { message: remark },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${JwtToken}`,
          },
        }
      );

      toast.success("Invoice sent for payment");
      setRemark("");
      setSelectedInvoice(null);
      fetchInvoices(activeTab);
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while sending the invoice for payment.";
      toast.error(errMsg);
      console.error("Error sending for payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const exportToExcel = () => {
    if (!invoices.length) return toast.warning("No invoices to export.");

    const dataToExport = invoices.map((inv) => ({
      "Vendor Code": inv.id,
      "Vendor Name": inv.name,
      "Vendor Address": inv.address,
      "Vendor State": inv.state,
      "GST Number": inv.gst_number,
      "PAN Number": inv.pan,
      "TIL Billing Location": inv.billing_location_til,
      "TIL Billing Address": inv.til_billing_address,
      "TIL State": inv.til_state,
      "PO Number": inv.po_number,
      "PO Date": inv.po_date,
      "Cost Center": inv.cost_center,
      "HSN/SAC Code": inv.sac_code,
      "Service/Goods Description": inv.service_desc,
      "Taxable Amount": inv.taxable_amt,
      "GST Rate": inv.gst_rate,
      CGST: inv.cgst,
      SGST: inv.sgst,
      IGST: inv.igst,
      "Place of Supply": inv.supply_place,
      "Business Name": inv.business_name,
      "PO PDFs": inv.pdfs?.po_pdf?.join(", ") || "",
      "Invoice PDFs": inv.pdfs?.invoice_pdf?.join(", ") || "",
      Status: inv.status,
      Remark: inv.remark || "",
      Reupload: inv.reupload ? "Yes" : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    saveAs(blob, `invoices_${activeTab}_${new Date().toISOString()}.xlsx`);
  };

  // 🔍 Client-side filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch = inv.gst_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      // inv.gst_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // inv.po_number?.toString().includes(searchTerm);
      const matchesStatus = statusFilter ? inv.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Group invoices by PO date with vendors count
  const invoicesByDate = useMemo(() => {
    const group = {};
    filteredInvoices.forEach((inv) => {
      if (!group[inv.po_date]) {
        group[inv.po_date] = {
          vendors: new Set(),
          invoices: [],
        };
      }
      group[inv.po_date].vendors.add(inv.name);
      group[inv.po_date].invoices.push(inv);
    });
    return group;
  }, [filteredInvoices]);

  return (
    <div className="p-6">
      {loading && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <Loader />
        </div>
      )}

      {/* --- Header --- */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Finance Inbox</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Export to Excel
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* --- Tabs --- */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {Object.entries(TABS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* --- Search & Filter --- */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by GST Number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-md px-3 py-2 flex-1"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="changes_requested">Changes Requested</option>
          <option value="sent_for_payment">Sent for Payment</option>
        </select>
      </div>

      {/* --- Grouped Invoice List --- */}
      <div className="space-y-4 px-4 sm:px-8 py-4">
        {Object.entries(invoicesByDate).length === 0 ? (
          <p className="text-gray-500 text-center">
            No matching invoices found.
          </p>
        ) : (
          Object.entries(invoicesByDate).map(
            ([date, { vendors, invoices }]) => {
              const isDateExpanded = expandedDate === date;

              return (
                <div
                  key={date}
                  className="border rounded-lg bg-white shadow-sm hover:shadow-md transition"
                >
                  {/* Date row */}
                  <div
                    className="flex justify-between items-center cursor-pointer p-4"
                    onClick={() => {
                      setExpandedDate(isDateExpanded ? null : date);
                      setExpandedInvoiceId(null);
                      setSelectedInvoice(null);
                      setRemark("");
                    }}
                  >
                    <div className="font-semibold">{date}</div>
                    <div className="text-gray-700 font-medium">
                      Uploaded Vendors: {vendors.size}
                    </div>
                  </div>

                  {/* Invoice list under the date */}
                  <AnimatePresence initial={false}>
                    {isDateExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t bg-gray-50"
                      >
                        {invoices.map((inv) => {
                          const isInvExpanded = expandedInvoiceId === inv.id;

                          return (
                            <div
                              key={inv.id}
                              className="border-b last:border-0 bg-white"
                            >
                              {/* Invoice summary */}
                              <div
                                className="flex justify-between p-3 cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                  if (expandedInvoiceId === inv.id) {
                                    setExpandedInvoiceId(null);
                                    setSelectedInvoice(null);
                                    setRemark("");
                                  } else {
                                    setExpandedInvoiceId(inv.id);
                                    setSelectedInvoice(inv);
                                    setRemark("");
                                  }
                                }}
                              >
                                <div>
                                  <div>
                                    Vendor Name: <strong>{inv.name}</strong>
                                  </div>
                                  <div>
                                    GSTN: <strong>{inv.gst_number}</strong>
                                  </div>
                                </div>
                                <div>
                                  <div
                                    className={`text-sm font-medium ${
                                      inv.status === "sent_for_payment"
                                        ? "text-green-700"
                                        : inv.status === "changes_requested"
                                        ? "text-yellow-600"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {inv.status.replaceAll("_", " ")}
                                  </div>
                                  {inv.reupload && (
                                    <div className="text-red-600 font-semibold text-sm">
                                      Reupload
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Invoice details and remark/payment UI */}
                              <AnimatePresence>
                                {isInvExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-4 text-sm text-gray-700 bg-white"
                                  >
                                    {/* Invoice details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                      <div>
                                        <p>
                                          <strong>Vendor Code:</strong> {inv.id}
                                        </p>
                                        <p>
                                          <strong>Vendor Address:</strong>{" "}
                                          {inv.address}
                                        </p>
                                        <p>
                                          <strong>GST Number:</strong>{" "}
                                          {inv.gst_number}
                                        </p>
                                        <p>
                                          <strong>PAN Number:</strong> {inv.pan}
                                        </p>
                                      </div>
                                      <div>
                                        <p>
                                          <strong>PO Number:</strong>{" "}
                                          {inv.po_number}
                                        </p>
                                        <p>
                                          <strong>PO Date:</strong>{" "}
                                          {inv.po_date}
                                        </p>
                                        <p>
                                          <strong>Cost Center:</strong>{" "}
                                          {inv.cost_center}
                                        </p>
                                        <p>
                                          <strong>HSN/SAC Code:</strong>{" "}
                                          {inv.sac_code}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mb-4">
                                      <p>
                                        <strong>
                                          Service/Goods Description:
                                        </strong>{" "}
                                        {inv.service_desc}
                                      </p>
                                      <p>
                                        <strong>Taxable Amount:</strong>{" "}
                                        {inv.taxable_amt}
                                      </p>
                                      <p>
                                        <strong>GST Rate:</strong>{" "}
                                        {inv.gst_rate}
                                      </p>
                                      <p>
                                        <strong>CGST:</strong> {inv.cgst}
                                      </p>
                                      <p>
                                        <strong>SGST:</strong> {inv.sgst}
                                      </p>
                                      <p>
                                        <strong>IGST:</strong> {inv.igst}
                                      </p>
                                      <p>
                                        <strong>Place of Supply:</strong>{" "}
                                        {inv.supply_place}
                                      </p>
                                      <p>
                                        <strong>Business Name:</strong>{" "}
                                        {inv.business_name}
                                      </p>
                                    </div>

                                    {/* PDFs */}
                                    <div className="mb-4 space-y-1">
                                      <p>
                                        <strong>PO PDFs:</strong>{" "}
                                        {inv.pdfs?.po_pdf?.length ? (
                                          inv.pdfs.po_pdf.map((url, i) => (
                                            <a
                                              key={i}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 underline mr-2"
                                            >
                                              PDF {i + 1}
                                            </a>
                                          ))
                                        ) : (
                                          <span className="text-gray-500">
                                            None
                                          </span>
                                        )}
                                      </p>
                                      <p>
                                        <strong>Invoice PDFs:</strong>{" "}
                                        {inv.pdfs?.invoice_pdf?.length ? (
                                          inv.pdfs.invoice_pdf.map((url, i) => (
                                            <a
                                              key={i}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 underline mr-2"
                                            >
                                              PDF {i + 1}
                                            </a>
                                          ))
                                        ) : (
                                          <span className="text-gray-500">
                                            None
                                          </span>
                                        )}
                                      </p>
                                    </div>

                                    {/* Remark Input */}
                                    <div className="mb-4">
                                      <textarea
                                        rows={3}
                                        placeholder="Enter remark..."
                                        value={remark}
                                        onChange={(e) =>
                                          setRemark(e.target.value)
                                        }
                                        className="w-full border rounded-md p-2 resize-none"
                                      />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 flex-wrap">
                                      <button
                                        onClick={handleSendRemark}
                                        disabled={loading}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                      >
                                        Send Remark to Vendor
                                      </button>

                                      <button
                                        onClick={handleSendForPayment}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                                      >
                                        Send for Payment
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
};

export default FinancePage;
