import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import axios from "axios";
import { useAuthCheck } from "../hooks/useAuthCheck";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import VendorInbox from "./VendorInbox";
import Loader from "./Loader/Loader";
import { toast } from "react-toastify";

const VendorPage = () => {
  const s3 = new S3Client({
    region: import.meta.env.VITE_AWS_REGION,
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    },
  });

  const { user, loading } = useAuthCheck();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    address: "",
    state: "",
    gst_number: "",
    pan: "",
    billing_location_til: "",
    til_billing_address: "",
    til_state: "",
    po_number: "",
    po_date: "",
    cost_center: "",
    sac_code: "",
    service_desc: "",
    taxable_amt: "",
    gst_rate: "",
    cgst: "",
    sgst: "",
    igst: "",
    supply_place: "",
    business_name: "",
    pdfs: {
      po_pdf: [],
      invoice_pdf: [],
    },
  });

  const pdfUploadFields = [
    { key: "po_pdf", label: "Upload PO Bill (PDF)" },
    { key: "invoice_pdf", label: "Upload Invoice (PDF)" },
    //Easily add more later
    // { key: "agreement_pdf", label: "Upload Agreement (PDF)" },
  ];

  const inputRefs = useRef({});
  const [inbox, setInbox] = useState([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [hasNewInbox, setHasNewInbox] = useState(false);
  const [reuploadFiles, setReuploadFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadedKeys, setUploadedKeys] = useState([]);
  const [hasFetchedInbox, setHasFetchedInbox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState(null);

  const fetchInbox = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.email) {
      try {
        const res = await axios.get(`${config.BASE_URL}/inbox/${user.email}`);
        const data = res.data;
        setInbox(data);
        setHasNewInbox(data.length > 0);
      } catch (error) {
        console.error("Error fetching inbox:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
      return;
    }

    if (activeTab === "inbox" && !hasFetchedInbox) {
      fetchInbox();
      setHasFetchedInbox(true);
    }
  }, [loading, user, activeTab, hasFetchedInbox, fetchInbox, navigate]);

  useEffect(() => {
    if (activeTab !== "inbox" && hasFetchedInbox) {
      setHasFetchedInbox(false);
    }
  }, [activeTab, hasFetchedInbox]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData((prev) => ({ ...prev, files: Array.from(files) }));
    } else {
      // Restrict numeric fields to digits and decimal point
      const numericFields = [
        "service_amount",
        "cgst",
        "sgst",
        "igst",
        "amount_with_gst",
      ];

      if (numericFields.includes(name) && /[^0-9.]/.test(value)) {
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleResetForm = () => {
    setFormData({
      id: "",
      name: "",
      address: "",
      state: "",
      gst_number: "",
      pan: "",
      billing_location_til: "",
      til_billing_address: "",
      til_state: "",
      po_number: "",
      po_date: "",
      cost_center: "",
      sac_code: "",
      service_desc: "",
      taxable_amt: "",
      gst_rate: "",
      cgst: "",
      sgst: "",
      igst: "",
      supply_place: "",
      business_name: "",
      pdfs: {
        po_pdf: [],
        invoice_pdf: [],
      },
    });
    setUploadedKeys([]);
  };

  const handleClear = async () => {
    for (const key of uploadedKeys) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
            Key: key,
          })
        );
      } catch (err) {
        console.error("Failed to delete from S3:", key, err);
      }
    }

    handleResetForm();
  };

  const handlePDFUpload = async (e, fieldKey) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} is not a PDF file.`);
        continue;
      }
      const arrayBuffer = await file.arrayBuffer();
      const key = `invoices/${fieldKey}_${Date.now()}_${file.name}`;
      const bucket = import.meta.env.VITE_S3_BUCKET_NAME || "";
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type,
      });
      try {
        await s3.send(command);
        const s3Url = `https://${bucket}.s3.${
          import.meta.env.VITE_AWS_REGION
        }.amazonaws.com/${key}`;
        setFormData((prev) => ({
          ...prev,
          pdfs: {
            ...prev.pdfs,
            [fieldKey]: [...(prev.pdfs[fieldKey] || []), s3Url],
          },
        }));
      } catch (err) {
        console.error("Error uploading file:", err);
        toast.error(`Error uploading ${file.name}`);
      }
    }
    setUploading(false);
  };

  const handleRemovePDF = async (fieldKey, fileUrl) => {
    try {
      // Extract the S3 key from the file URL
      const bucket = import.meta.env.VITE_S3_BUCKET_NAME || "";
      const region = import.meta.env.VITE_AWS_REGION || "";
      const s3BaseUrl = `https://${bucket}.s3.${region}.amazonaws.com/`;
      const key = fileUrl.replace(s3BaseUrl, "");

      // Delete the file from S3
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      // Update the formData state to remove the file URL
      setFormData((prev) => ({
        ...prev,
        pdfs: {
          ...prev.pdfs,
          [fieldKey]: prev.pdfs[fieldKey].filter((url) => url !== fileUrl),
        },
      }));

      // Update uploadedKeys state to remove the deleted key
      setUploadedKeys((prev) => prev.filter((k) => k !== key));

      // 🧼 Reset file input
      if (inputRefs.current[fieldKey]) {
        inputRefs.current[fieldKey].value = "";
      }

      toast.success("File removed successfully from S3 and form.");
    } catch (err) {
      console.error("Failed to delete from S3:", err);
      toast.error("Error removing file from S3.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: Please log in again.");
        return;
      }
      await axios.post(
        `${config.BASE_URL}/vendor/upload`,
        { ...formData, email: user?.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("File uploaded successfully and finance notified.");
      handleResetForm();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReupload = async (
    invoiceId,
    filesByField = {},
    updatedFields
  ) => {
    // if (
    //   !filesByField ||
    //   Object.values(filesByField).every((arr) => !arr?.length)
    // ) {
    //   toast.warning("Please select at least one file to reupload.");
    //   return;
    // }

    try {
      setUploadingInvoiceId(invoiceId);

      const bucket = import.meta.env.VITE_S3_BUCKET_NAME || "";
      const uploadedPdfs = {};

      for (const [fieldKey, files] of Object.entries(filesByField)) {
        if (!files?.length) continue;

        uploadedPdfs[fieldKey] = [];

        for (const file of files) {
          if (file.type !== "application/pdf") {
            toast.error(`${file.name} is not a PDF file.`);
            continue;
          }

          const arrayBuffer = await file.arrayBuffer();
          const key = `invoices/reupload/${fieldKey}_${Date.now()}_${
            file.name
          }`;

          const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: new Uint8Array(arrayBuffer),
            ContentType: file.type,
          });

          await s3.send(command);

          const s3Url = `https://${bucket}.s3.${
            import.meta.env.VITE_AWS_REGION
          }.amazonaws.com/${key}`;

          // push into array for that field
          uploadedPdfs[fieldKey].push(s3Url);
        }
      }

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${config.BASE_URL}/reupload/${invoiceId}`,
        {
          pdfs: uploadedPdfs, // Send updated PDFs object
          ...updatedFields, // Send all other updated invoice fields
          reupload: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status >= 200 && res.status < 300) {
        toast.success("Invoice reuploaded successfully");
        fetchInbox();
      } else {
        toast.error(res.data.message || "Reupload failed");
      }
    } catch (error) {
      console.error("Reupload error:", error);
      toast.error("Something went wrong during reupload.");
    } finally {
      setUploadingInvoiceId(null);
    }
  };

  const handleAutoFill = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized: Please log in again.");
      return;
    }
    if (!formData.gst_number) {
      toast.warning("Please enter a Vendor GSTN to search.");
      return;
    }
    try {
      const res = await axios.get(
        `${config.BASE_URL}/vendor/gst/${formData.gst_number}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const vendor = res.data.vendor;
      if (!vendor) {
        toast.error("Vendor not found");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        id: vendor.id || "",
        name: vendor.name || "",
        address: vendor.address || "",
        state: vendor.state || "",
        gst_number: vendor.gst_number || "",
        pan: vendor.pan || "",
      }));
      toast.success("Vendor details autofilled.");
    } catch (err) {
      console.error("Failed to autofill data:", err);
      toast.error("Vendor not found or server error.");
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center pointer-events-auto">
        <Loader />
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Vendor Dashboard</h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 cursor-pointer"
        >
          Logout
        </button>
      </div>

      <div className="flex justify-center mb-6">
        <button
          className={`px-4 py-2 rounded-l-md cursor-pointer ${
            activeTab === "upload" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("upload")}
        >
          Upload
        </button>
        <button
          className={`relative px-4 py-2 rounded-r-md cursor-pointer ${
            activeTab === "inbox" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => {
            setActiveTab("inbox");
            setHasNewInbox(false);
          }}
        >
          Inbox
          {hasNewInbox && (
            <span className="absolute top-0 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
          )}
        </button>
      </div>

      {activeTab === "upload" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3 w-2xs">
            <input
              type="text"
              name="gst_number"
              placeholder="Vendor GSTN"
              value={formData.gst_number}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
            <button
              onClick={handleAutoFill}
              className="bg-blue-600 text-white px-4 py-1 rounded cursor-pointer w-fit"
              type="button"
            >
              Search
            </button>
          </div>

          <div>
            {/* Vendor Information */}
            <div>
              <div className="font-medium my-1">Vendor Information</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="id"
                  placeholder="Vendor Code"
                  value={formData.id}
                  onChange={handleChange}
                  required
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Vendor Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Vendor Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="Vendor State"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
                <input
                  type="text"
                  name="gst_number"
                  placeholder="GST Number"
                  value={formData.gst_number}
                  onChange={handleChange}
                  required
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
                <input
                  type="text"
                  name="pan"
                  placeholder="PAN Number"
                  value={formData.pan}
                  onChange={handleChange}
                  required
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
              </div>
            </div>

            {/* TIL Details */}
            <div>
              <div className="font-medium my-2">TIL's Own Details</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="billing_location_til"
                  placeholder="TIL Billing location"
                  value={formData.billing_location_til}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
                <input
                  type="text"
                  name="til_billing_address"
                  placeholder="TIL Billing Address"
                  value={formData.til_billing_address}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
                <input
                  type="text"
                  name="til_state"
                  placeholder="TIL State"
                  value={formData.til_state}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Purchase Order Details */}
            <div>
              <div className="font-medium mt-3">
                Purchase Order Details: Linking Procurement to Payments
              </div>
              {/* Administrative Data */}
              <div>
                <div className="font-medium mb-2">Administrative Data</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="po_number"
                    placeholder="PO Number"
                    value={formData.po_number}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                  <input
                    type="date"
                    name="po_date"
                    placeholder="PO Date"
                    value={formData.po_date}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                  <input
                    type="text"
                    name="cost_center"
                    placeholder="Cost Center"
                    value={formData.cost_center}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                </div>
              </div>
              {/* Product & Tax Details */}
              <div>
                <div className="font-medium my-2">Product & Tax Details</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="sac_code"
                    placeholder="HSN/SAC Code"
                    value={formData.sac_code}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                  <input
                    type="text"
                    name="service_desc"
                    placeholder="Service/Goods Description"
                    value={formData.service_desc}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                  <input
                    type="text"
                    name="taxable_amt"
                    placeholder="Taxable Amount"
                    value={formData.taxable_amt}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                  <input
                    type="text"
                    name="gst_rate"
                    placeholder="GST Rate"
                    value={formData.gst_rate}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                </div>
              </div>
              {/* GST Specifics */}
              <div>
                <div className="font-medium my-2">GST Specifics</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="cgst"
                    placeholder="CGST"
                    value={formData.cgst}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                  <input
                    type="text"
                    name="sgst"
                    placeholder="SGST"
                    value={formData.sgst}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                  <input
                    type="text"
                    name="igst"
                    placeholder="IGST"
                    value={formData.igst}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                  <input
                    type="text"
                    name="supply_place"
                    placeholder="Place of Supply"
                    value={formData.supply_place}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                  <input
                    type="text"
                    name="business_name"
                    placeholder="Business Name"
                    value={formData.business_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-y-4">
            {pdfUploadFields.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <label className="block font-medium">{label}</label>

                {/* Multiple upload input */}
                <input
                  ref={(el) => (inputRefs.current[key] = el)}
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => handlePDFUpload(e, key)}
                  className="w-full"
                />

                {/* Show uploaded files */}
                {formData.pdfs[key] && formData.pdfs[key].length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {formData.pdfs[key].map((fileUrl, idx) => (
                      <li key={idx} className="flex items-center space-x-3">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          View PDF {idx + 1}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemovePDF(key, fileUrl)}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {uploading && <p>Uploading PDF...</p>}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            {submitting ? (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center pointer-events-auto">
                <Loader />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-gray-200 px-4 py-2 rounded-md cursor-pointer hover:bg-gray-300"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  Submit
                </button>
              </>
            )}
          </div>
        </form>
      ) : (
        <VendorInbox
          inbox={inbox}
          setInbox={setInbox}
          reuploadFiles={reuploadFiles}
          setReuploadFiles={setReuploadFiles}
          fetchInbox={fetchInbox}
          handleReupload={handleReupload}
          uploadingInvoiceId={uploadingInvoiceId}
        />
      )}
    </div>
  );
};

export default VendorPage;
