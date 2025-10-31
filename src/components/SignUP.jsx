import { useState } from "react";
import Select from "react-select";
import config from "../../config";
import axios from "axios";
import { toast } from "react-toastify";

const SignUP = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formData, setFormData] = useState({ role: null });
  const roleList = [
    { label: "Vendor", value: "vendor" },
    { label: "Finance", value: "finance" },
    { label: "Admin", value: "admin" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${config.BASE_URL}/signup`, {
        name,
        email,
        password,
        role: formData.role?.value,
      });
      const data = response.data;

      if (response.status === 201) {
        toast.success("Account created successfully!");
        setName("");
        setEmail("");
        setPassword("");
        setFormData({ role: null });
      } else {
        toast.warning(data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      const errMsg =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Create an Account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
              className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Role
            </label>
            <Select
              inputId="role-select"
              name="role"
              options={roleList.map((cat) => ({
                value: cat.value,
                label: cat.label,
              }))}
              classNamePrefix="select"
              onChange={(selectedOption) =>
                setFormData((prev) => ({
                  ...prev,
                  role: selectedOption
                    ? {
                        value: selectedOption.value,
                        label: selectedOption.label,
                      }
                    : null,
                }))
              }
              value={
                formData.role
                  ? {
                      value: formData.role.value,
                      label: formData.role.label,
                    }
                  : null
              }
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "0.375rem",
                  padding: "2px",
                  borderColor: "#d1d5db",
                  cursor: "pointer",
                }),
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition cursor-pointer"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUP;
