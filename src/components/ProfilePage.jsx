import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import Loader from "./Loader/Loader";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Unauthorized: No token found");
        return;
      }

      try {
        const res = await axios.get(`${config.BASE_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Unauthorized or session expired");
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const goHome = () => {
    navigate("/vendor-dashboard");
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center pointer-events-auto">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col py-10 px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Profile Page</h2>
        <div className="space-x-2">
          <button
            onClick={goHome}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded shadow-sm">
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-lg font-semibold text-gray-800">{user.name}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded shadow-sm">
            <p className="text-sm text-gray-500">Address</p>
            <p className="text-lg font-semibold text-gray-800">
              {user.address}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded shadow-sm">
            <p className="text-sm text-gray-500">GST Number</p>
            <p className="text-lg font-semibold text-gray-800">
              {user.gst_number}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded shadow-sm">
            <p className="text-sm text-gray-500">PAN</p>
            <p className="text-lg font-semibold text-gray-800">{user.pan}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
