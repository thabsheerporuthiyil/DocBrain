import api from "./axios";

export const uploadDocument = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get("/documents/");
  return response.data.documents ?? [];
};

export const getDocumentFile = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/file`, {
    responseType: "blob",
  });

  return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};
