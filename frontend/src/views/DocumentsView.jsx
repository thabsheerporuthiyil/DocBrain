import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  FileText,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "../api/documents";

const statusStyles = {
  indexed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  processing: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  failed: "border-rose-500/20 bg-rose-500/10 text-rose-300",
};

function DocumentsView() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const hasProcessingDocs = useMemo(
    () => documents.some((doc) => doc.status === "processing"),
    [documents]
  );

  const fetchDocuments = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data || []);
      setError("");
    } catch (err) {
      setError("Unable to load documents.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (!hasProcessingDocs) return undefined;
    const intervalId = setInterval(() => fetchDocuments({ silent: true }), 5000);
    return () => clearInterval(intervalId);
  }, [hasProcessingDocs]);

  const handlePickFile = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      await uploadDocument(selectedFile, (event) => {
        if (!event.total) return;
        setUploadProgress(Math.round((event.loaded * 100) / event.total));
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchDocuments({ silent: true });
    } catch (err) {
      setError(err.response?.data?.detail ?? "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(documentId);
      setDocuments((current) => current.filter((doc) => doc.document_id !== documentId));
    } catch (err) {
      setError("Delete failed.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Your Documents</h1>
          <p className="mt-2 text-zinc-400">Manage and chat with your uploaded PDFs.</p>
        </div>
        <button
          onClick={() => fetchDocuments()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-6 text-sm font-medium text-zinc-200 transition hover:bg-white/5"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* Document List */}
        <div className="space-y-4">
          {isLoading && documents.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-white/8 bg-white/2">
              <LoaderCircle size={24} className="animate-spin text-zinc-500" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/2 text-center p-8">
              <FileText size={32} className="text-zinc-600 mb-4" />
              <p className="text-zinc-400">No documents yet. Use the panel on the right to upload one.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <article key={doc.document_id} className="group rounded-3xl border border-white/8 bg-white/2 p-5 transition-all hover:border-white/20">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{doc.filename}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyles[doc.status]}`}>
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/dashboard/chat/${doc.document_id}`}
                      className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition ${
                        doc.status === 'indexed' 
                        ? "bg-white text-black hover:bg-zinc-200" 
                        : "bg-white/5 text-zinc-600 pointer-events-none"
                      }`}
                    >
                      Open Chat <ArrowRight size={14} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(doc.document_id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-500 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Upload Panel */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/8 bg-[#070707] p-6 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                <Upload size={18} />
              </div>
              <h2 className="font-semibold text-white">Upload PDF</h2>
            </div>

            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/2 p-4 text-center transition hover:bg-white/4">
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePickFile} />
              <Upload size={20} className="text-zinc-500 mb-2" />
              <p className="text-xs font-medium text-zinc-300">{selectedFile ? selectedFile.name : "Select a file"}</p>
            </label>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="mt-6 w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-black text-sm font-bold transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {isUploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload Document
            </button>

            {isUploading && (
              <div className="mt-4">
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {error && <p className="mt-4 text-xs text-rose-400 text-center">{error}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default DocumentsView;
