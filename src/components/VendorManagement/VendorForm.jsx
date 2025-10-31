import { useEffect, useState } from "react";

const VendorForm = ({ onCreate, onUpdate, editingVendor }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    address: "",
    state: "",
    gst_number: "",
    pan: "",
  });

  useEffect(() => {
    if (editingVendor) {
      setFormData(editingVendor);
    } else {
      setFormData({
        id: "",
        name: "",
        address: "",
        state: "",
        gst_number: "",
        pan: "",
      });
    }
  }, [editingVendor]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingVendor) {
      onUpdate(formData);
    } else {
      onCreate(formData);
    }

    setFormData({
      id: "",
      name: "",
      address: "",
      state: "",
      gst_number: "",
      pan: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 bg-white p-6 shadow rounded-md"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!editingVendor && (
          <input
            name="id"
            placeholder="ID"
            value={formData.id}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
        )}
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="border rounded p-2"
        />
        <input
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
          className="border rounded p-2"
        />
        <input
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
          className="border rounded p-2"
        />
        <input
          name="gst_number"
          placeholder="GST Number"
          value={formData.gst_number}
          onChange={handleChange}
          className="border rounded p-2"
        />
        <input
          name="pan"
          placeholder="PAN"
          value={formData.pan}
          onChange={handleChange}
          className="border rounded p-2"
        />
      </div>
      <button
        type="submit"
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {editingVendor ? "Update Vendor" : "Create Vendor"}
      </button>
    </form>
  );
};

export default VendorForm;
