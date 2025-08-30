import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import InputModal from "../components/InputModal";

const Dashboard = () => {
  const [folders, setFolders] = useState([{ id: "root", name: "Root", children: [] }]);
  const [images, setImages] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("Root");
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    placeholder: "",
    initialValue: "",
    onSubmit: null,
  });

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      setUser(savedUser);
      fetchFolders();
      fetchImages(null);
    }
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await axiosInstance.get("/folders");
      const nested = buildNestedFolders(res.data);
      setFolders([{ id: "root", name: "Root", children: nested }]);
    } catch (err) {
      console.error(err);
    }
  };

  const buildNestedFolders = (flatFolders, parentId = null) => {
    return flatFolders
      .filter((f) => f.parent === parentId)
      .map((f) => ({ ...f, children: buildNestedFolders(flatFolders, f._id) }));
  };

  const fetchImages = async (folderId) => {
    if (!folderId) return setImages([]);
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/images/${folderId}`);
      setImages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder.name);
    setSelectedFolderId(folder._id || null);
    fetchImages(folder._id || null);
  };

  const addFolderToState = (folderList, parentId, newFolder) => {
    return folderList.map((folder) => {
      if ((folder._id || folder.id) === parentId) {
        return { ...folder, children: [...(folder.children || []), newFolder] };
      }
      if (folder.children?.length > 0) {
        return { ...folder, children: addFolderToState(folder.children, parentId, newFolder) };
      }
      return folder;
    });
  };

  // -------------------
  // Folder / Image Actions
  // -------------------

  const handleCreateFolder = async (folderName) => {
    if (!folderName) return;
    try {
      const res = await axiosInstance.post("/folders", {
        name: folderName,
        parentId: selectedFolderId,
      });
      const newFolder = { ...res.data, children: [] };

      if (!selectedFolderId || selectedFolderId === "root") {
        setFolders((prev) => {
          const updated = [...prev];
          updated[0].children = [...updated[0].children, newFolder];
          return updated;
        });
      } else {
        setFolders((prev) => addFolderToState(prev, selectedFolderId, newFolder));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create folder");
    }
  };

  const handleRenameFolder = async (folder, newName) => {
    if (!newName || newName === folder.name) return;
    try {
      await axiosInstance.patch(`/folders/${folder._id}/rename`, { newName });
      const renameRecursive = (list) =>
        list.map((f) => {
          if (f._id === folder._id) return { ...f, name: newName };
          if (f.children?.length > 0) return { ...f, children: renameRecursive(f.children) };
          return f;
        });
      setFolders(renameRecursive(folders));
      if (selectedFolderId === folder._id) setSelectedFolder(newName);
    } catch (err) {
      console.error(err);
      alert("Failed to rename folder");
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}" and all its contents?`)) return;
    try {
      await axiosInstance.delete(`/folders/${folder._id}`);
      const deleteRecursive = (list) =>
        list.filter((f) => f._id !== folder._id).map((f) => ({ ...f, children: deleteRecursive(f.children) }));
      setFolders(deleteRecursive(folders));
      if (selectedFolderId === folder._id) {
        setSelectedFolder("Root");
        setSelectedFolderId(null);
        fetchImages(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete folder");
    }
  };

  const handleImageUpload = async (file, name, folderId) => {
    if (!file || !name || !folderId) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("name", name);
    formData.append("folderId", folderId);
    try {
      const res = await axiosInstance.post("/images", formData);
      setImages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    }
  };

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await axiosInstance.delete(`/images/${imgId}`);
      setImages((prev) => prev.filter((img) => img._id !== imgId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete image");
    }
  };

  const handleDownloadImage = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.target = "_blank";
    link.click();
  };

  const handleSearch = async () => {
    if (!searchQuery || !selectedFolderId) return fetchImages(selectedFolderId);
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/images/search/${searchQuery}`);
      setImages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------
  // Modal Open Handlers
  // -------------------

  const openCreateFolderModal = () => {
    setModalConfig({
      title: "Create New Folder",
      placeholder: "Folder name",
      initialValue: "",
      onSubmit: handleCreateFolder,
    });
    setModalOpen(true);
  };

  const openRenameFolderModal = (folder) => {
    setModalConfig({
      title: "Rename Folder",
      placeholder: "New folder name",
      initialValue: folder.name,
      onSubmit: (newName) => handleRenameFolder(folder, newName),
    });
    setModalOpen(true);
  };

  const openImageNameModal = (file) => {
    setModalConfig({
      title: "Name Your Image",
      placeholder: "Image name",
      initialValue: file.name,
      onSubmit: (name) => handleImageUpload(file, name, selectedFolderId),
    });
    setModalOpen(true);
  };

  const renderFolders = (folderList) =>
    folderList.map((folder) => (
      <div key={folder._id || folder.id} className="ml-4 mt-2 flex items-center justify-between">
        <div
          className={`cursor-pointer p-1 rounded ${
            selectedFolderId === folder._id ? "bg-blue-200" : "hover:bg-gray-300"
          }`}
          onClick={() => handleSelectFolder(folder)}
        >
          {folder.name}
        </div>
        <div className="flex gap-1">
          <button onClick={() => openRenameFolderModal(folder)} className="text-sm text-yellow-700">✏️</button>
          <button onClick={() => handleDeleteFolder(folder)} className="text-sm text-red-700">🗑️</button>
        </div>
        {folder.children?.length > 0 && <div className="ml-4">{renderFolders(folder.children)}</div>}
      </div>
    ));

  return (
  <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-200">
  {/* Top Bar */}
  <div className="bg-gray-800 text-white p-4 flex flex-col sm:flex-row justify-between shadow-md gap-3 sm:gap-0">
    <h1 className="text-xl font-bold tracking-wide">Image-Drive</h1>
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
      <input
        type="text"
        placeholder="Search images..."
        className="p-2 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 hover:bg-blue-600 px-4 py-1 rounded-lg transition w-full sm:w-auto"
      >
        Search
      </button>
      <button
        onClick={() => { localStorage.removeItem("user"); navigate("/"); }}
        className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded-lg transition w-full sm:w-auto"
      >
        Logout
      </button>
    </div>
  </div>

  {/* Main Content */}
  <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
    {/* Sidebar */}
    <div className="w-full sm:w-1/4 bg-white p-4 overflow-auto shadow-lg rounded-r-2xl mb-4 sm:mb-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-gray-700">Folders</h2>
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition"
          onClick={openCreateFolderModal}
        >
          + New
        </button>
      </div>
      <div className="space-y-1">{renderFolders(folders)}</div>
    </div>

    {/* Images Section */}
    <div className="flex-1 p-4 sm:p-6 overflow-auto">
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-3 sm:gap-0 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800">{selectedFolder}</h2>
        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="uploadInput"
            onChange={(e) => openImageNameModal(e.target.files[0])}
          />
          <label
            htmlFor="uploadInput"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition"
          >
            + Upload Image
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {images.map((img) => (
            <div
              key={img._id || img.id}
              className="bg-white p-3 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col items-center relative"
            >
              <img
                src={img.url || URL.createObjectURL(img.file)}
                alt={img.name}
                className="w-full sm:w-28 h-28 object-cover rounded-lg mb-3"
              />
              <p className="text-gray-700 font-medium text-center break-words">{img.name}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleDownloadImage(img.url, img.name)}
                  className="text-sm px-2 py-1 rounded bg-blue-100 hover:bg-blue-200"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => handleDeleteImage(img._id)}
                  className="text-sm px-2 py-1 rounded bg-red-100 hover:bg-red-200"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>

  {/* Reusable Modal */}
  <InputModal
    isOpen={modalOpen}
    title={modalConfig.title}
    placeholder={modalConfig.placeholder}
    initialValue={modalConfig.initialValue}
    onClose={() => setModalOpen(false)}
    onSubmit={modalConfig.onSubmit}
  />
</div>

  );
};

export default Dashboard;
