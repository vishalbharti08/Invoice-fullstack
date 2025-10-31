import { useEffect, useState, useRef } from "react";
import axios from "axios";
import VendorForm from "./VendorForm";
import VendorList from "./VendorList";
import VendorBulkReader from "./VendorBulkReader";
import AuditLog from "./AuditLogs";
import config from "../../../config";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("vendors"); // ✅ Tab state
  const navigate = useNavigate();
  const formRef = useRef(null);

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${config.BASE_URL}/vendor`);
      setVendors(response.data.vendors);
      setFilteredVendors(response.data.vendors);
    } catch (error) {
      console.error("Error fetching vendors", error);
    }
  };

  useEffect(() => {
    if (activeTab === "vendors") {
      fetchVendors();
    }
  }, [activeTab]);

  // Search filter
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = vendors.filter((vendor) =>
      Object.values(vendor).some((value) =>
        String(value).toLowerCase().includes(lowerQuery)
      )
    );
    setFilteredVendors(filtered);
  }, [searchQuery, vendors]);

  // CRUD Handlers
  const handleCreate = async (vendor) => {
    try {
      await axios.post(`${config.BASE_URL}/vendor`, vendor);
      fetchVendors();
    } catch (error) {
      console.error("Error creating vendor", error);
    }
  };

  const handleUpdate = async (vendor) => {
    try {
      await axios.put(`${config.BASE_URL}/${vendor.id}`, vendor);
      setEditingVendor(null);
      fetchVendors();
    } catch (error) {
      console.error("Error updating vendor", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${config.BASE_URL}/vendor/${id}`);
      fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor", error);
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header: Tabs + Logout */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "vendors" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setActiveTab("vendors")}
          >
            Vendors
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "audit" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setActiveTab("audit")}
          >
            Audit
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>

      {/* Vendors Tab */}
      {activeTab === "vendors" && (
        <>
          <div ref={formRef}>
            <VendorForm
              onCreate={handleCreate}
              onUpdate={handleUpdate}
              editingVendor={editingVendor}
            />
          </div>

          <VendorBulkReader onUploadSuccess={fetchVendors} />

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          <VendorList
            vendors={filteredVendors}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </>
      )}

      {/* Audit Tab */}
      {activeTab === "audit" && <AuditLog />}
    </div>
  );
};

export default AdminPage;
