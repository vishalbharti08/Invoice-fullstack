const VendorList = ({ vendors, onDelete, onEdit }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">ID</th>
            <th className="py-2 px-4 border">Name</th>
            <th className="py-2 px-4 border">Address</th>
            <th className="py-2 px-4 border">State</th>
            <th className="py-2 px-4 border">GST</th>
            <th className="py-2 px-4 border">PAN</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="text-center">
              <td className="py-2 px-4 border">{vendor.id}</td>
              <td className="py-2 px-4 border">{vendor.name}</td>
              <td className="py-2 px-4 border">{vendor.address}</td>
              <td className="py-2 px-4 border">{vendor.state}</td>
              <td className="py-2 px-4 border">{vendor.gst_number}</td>
              <td className="py-2 px-4 border">{vendor.pan}</td>
              <td className="py-2 px-4 border space-x-2">
                <button
                  onClick={() => onEdit(vendor)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(vendor.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {vendors.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No vendors found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VendorList;
