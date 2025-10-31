import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../../config";
import { saveAs } from "file-saver";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${config.BASE_URL}/audit-logs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setLogs(response.data);
      setFilteredLogs(response.data);
    } catch (error) {
      console.error("Error fetching audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = logs;

    if (roleFilter !== "all") {
      filtered = filtered.filter((log) => log.role === roleFilter);
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [roleFilter, actionFilter, logs]);

  // Unique values for filters
  const uniqueRoles = [...new Set(logs.map((log) => log.role))];
  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Export to CSV
  const exportCSV = () => {
    const headers = [
      "Timestamp",
      "GST Number",
      "PO Number",
      "Invoice ID",
      "Action",
      "Details",
      "Performed By",
      "Role",
    ];

    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.gst_number,
      log.po_number,
      log.invoice_id,
      log.action,
      log.details,
      log.performed_by,
      log.role,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `audit-logs-${Date.now()}.csv`);
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Roles</option>
          {uniqueRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>

        <button
          onClick={exportCSV}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Export to CSV
        </button>
      </div>

      {/* Logs Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="overflow-auto border rounded">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Timestamp</th>
                  <th className="border px-4 py-2 text-left">GST Number</th>
                  <th className="border px-4 py-2 text-left">PO Number</th>
                  <th className="border px-4 py-2 text-left">Invoice ID</th>
                  <th className="border px-4 py-2 text-left">Action</th>
                  <th className="border px-4 py-2 text-left">Details</th>
                  <th className="border px-4 py-2 text-left">Performed By</th>
                  <th className="border px-4 py-2 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">{log.gst_number}</td>
                    <td className="border px-4 py-2">{log.po_number}</td>
                    <td className="border px-4 py-2">{log.invoice_id}</td>
                    <td className="border px-4 py-2">{log.action}</td>
                    <td className="border px-4 py-2">{log.details}</td>
                    <td className="border px-4 py-2">{log.performed_by}</td>
                    <td className="border px-4 py-2 capitalize">{log.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-center space-x-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === index + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogs;
