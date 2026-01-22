const presets = {
  smartphones: "sphere_smartphones",
  laptops: "sphere_laptop",
  appliances: "sphere_appliance",
  brands: "sphere_brands",
  networking: "sphere_networking",
};

async function uploadToCloudinary(file, type) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const presets = {
    smartphones: "sphere_smartphones",
    laptops: "sphere_laptop",
    appliances: "sphere_appliance",
    brands: "sphere_brands",
    networking: "sphere_networking",
  };

  async function uploadToCloudinary(file, type) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error("VITE_CLOUDINARY_CLOUD_NAME is not defined in .env");
    }

    const preset = presets[type];
    if (!preset) {
      throw new Error(`No upload preset configured for type: ${type}`);
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
const presets = {
  smartphones: "sphere_smartphones",
  laptops: "sphere_laptop",
  appliances: "sphere_appliance",
  brands: "sphere_brands",
  networking: "sphere_networking",
};

async function uploadToCloudinary(file, type) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("VITE_CLOUDINARY_CLOUD_NAME is not defined in .env");
  }

  const preset = presets[type];
  if (!preset) {
    throw new Error(`No upload preset configured for type: ${type}`);
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const res = await fetch(url, { method: "POST", body: formData });
  let data;
  try {
    data = await res.json();
  } catch (err) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary returned non-JSON response: ${text}`);
  }

  if (!res.ok) {
    const errMsg = (data && data.error && data.error.message) || JSON.stringify(data);
    console.error("Cloudinary upload failed:", res.status, errMsg);
    throw new Error(`Cloudinary upload failed: ${errMsg}`);
  }

  if (!data.secure_url) {
    throw new Error("Cloudinary response missing secure_url");
  }

  return data; // caller may use secure_url and other metadata
}

export { presets, uploadToCloudinary };
