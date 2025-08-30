import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const Dashboard = () => {
  const [folders, setFolders] = useState([{ id: "root", name: "Root", children: [] }]);
  const [images, setImages] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("Root");
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

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

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;
    try {
      const res = await axiosInstance.post("/folders", { name: folderName, parentId: selectedFolderId });
      const newFolder = { ...res.data, children: [] };

      if (!selectedFolderId || selectedFolderId === "root") {
        setFolders((prev) => [
          prev[0],
          { ...prev[0], children: [...prev[0].children, newFolder] },
        ]);
      } else {
        setFolders((prev) => addFolderToState(prev, selectedFolderId, newFolder));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create folder");
    }
  };

  const handleRenameFolder = async (folder) => {
    const newName = prompt("Enter new folder name:", folder.name);
    if (!newName || newName === folder.name) return;
    try {
       console.log("error in renaming :",folder._id);
      await axiosInstance.patch(`/folders/${folder._id}/rename`, {newName });
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


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const name = prompt("Enter image name:");
    if (!file || !name || !selectedFolderId) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("name", name);
    formData.append("folderId", selectedFolderId);
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
          <button onClick={() => handleRenameFolder(folder)} className="text-sm text-yellow-700">✏️</button>
          <button onClick={() => handleDeleteFolder(folder)} className="text-sm text-red-700">🗑️</button>
        </div>
        {folder.children?.length > 0 && <div className="ml-4">{renderFolders(folder.children)}</div>}
      </div>
    ));

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-zinc-600 text-white p-4 flex justify-between">
        <h1 className="text-lg font-bold">My Drive</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search images..."
            className="p-1 rounded text-black bg-amber-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleSearch} className="bg-blue-500 px-3 py-1 rounded">Search</button>
          <button onClick={() => { localStorage.removeItem("user"); window.location.reload(); }}
            className="bg-red-500 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="w-1/4 bg-gray-100 p-4 overflow-auto">
          <h2 className="font-bold mb-2">Folders</h2>
          <button className="bg-green-500 text-white px-2 py-1 rounded mb-2" onClick={handleCreateFolder}>
            + New Folder
          </button>
          <div>{renderFolders(folders)}</div>
        </div>

        <div className="flex-1 p-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">{selectedFolder}</h2>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="uploadInput" />
            <label htmlFor="uploadInput" className="bg-blue-500 text-white px-2 py-1 rounded cursor-pointer">+ Upload Image</label>
          </div>

          {loading ? <p>Loading...</p> : (
            <div className="grid grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img._id || img.id} className="border rounded p-2 flex flex-col items-center relative">
                  <img src={img.url || URL.createObjectURL(img.file)} alt={img.name} className="w-24 h-24 object-cover mb-2" />
                  <p>{img.name}</p>
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => handleDownloadImage(img.url, img.name)} className="text-sm text-blue-700">⬇️</button>
                    <button onClick={() => handleDeleteImage(img._id)} className="text-sm text-red-700">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
