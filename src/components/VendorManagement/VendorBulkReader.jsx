import * as XLSX from "xlsx";
import axios from "axios";
import config from "../../../config";

const VendorBulkReader = ({ onUploadSuccess }) => {
  const handleFileRead = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Optional: validate required fields
      const formattedData = jsonData.map((v) => ({
        id: v["ID"],
        name: v["Name"],
        address: v["Address"],
        state: v["State"],
        gst_number: v["GST Number"],
        pan: v["PAN"],
      }));

      try {
        await axios.post(`${config.BASE_URL}/vendor/bulk-create`, {
          vendors: formattedData,
        });
        alert("Vendors created successfully!");
        onUploadSuccess(); // refresh vendor list
      } catch (error) {
        console.error("Error saving vendors:", error);
        alert("Failed to save vendors.");
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="my-4 p-4 bg-white border rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Import Vendors from Excel</h2>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileRead}
        className="mb-2"
      />
    </div>
  );
};

export default VendorBulkReader;
