import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ExternalLink,
  FileDown,
  LoaderCircle,
  MessageSquareText,
  SendHorizonal,
  Trash2,
} from "lucide-react";

import Navbar from "../components/Navbar";
import {
  clearDocumentChatHistory,
  getDocumentChatHistory,
  streamDocumentQuestion,
} from "../api/chat";
import { getDocumentFile, getDocuments } from "../api/documents";

function Chat() {
  const { documentId } = useParams();
  const numericDocumentId = Number(documentId);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.innerWidth >= 1024;
  });
  const previewUrlRef = useRef("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const isDesktopPreview = typeof window !== "undefined" && window.innerWidth >= 1024;

  const activeDocument = useMemo(
    () => documents.find((doc) => doc.document_id === numericDocumentId),
    [documents, numericDocumentId]
  );

  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoadingDocument(true);

      try {
        const data = await getDocuments();
        setDocuments(data);
        setError(
          data.some((doc) => doc.document_id === numericDocumentId)
            ? ""
            : "Document not found."
        );
      } catch (err) {
        setError(err.response?.data?.detail ?? "Unable to load document.");
      } finally {
        setIsLoadingDocument(false);
      }
    };

    loadDocuments();
  }, [numericDocumentId]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getDocumentChatHistory(numericDocumentId);

        if (history.length > 0) {
          setMessages(
            history.map((message) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              sources: message.sources ?? [],
            }))
          );
          return;
        }

        setMessages([
          {
            id: "intro",
            role: "assistant",
            content:
              "Ask a question about this document and I'll answer from the indexed content.",
            sources: [],
          },
        ]);
      } catch (err) {
        setMessages([
          {
            id: "intro",
            role: "assistant",
            content:
              "Ask a question about this document and I'll answer from the indexed content.",
            sources: [],
          },
        ]);
        setError(err.response?.data?.detail ?? "Unable to load chat history.");
      }
    };

    if (numericDocumentId) {
      loadHistory();
    }
  }, [numericDocumentId]);

  useEffect(() => {
    if (!activeDocument || activeDocument.status !== "processing") {
      return undefined;
    }

    const intervalId = setInterval(async () => {
      try {
        const data = await getDocuments();
        setDocuments(data);
      } catch {
        // Keep the current UI state when background refresh fails.
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeDocument]);

  useEffect(() => {
    if (!numericDocumentId) {
      return undefined;
    }

    const loadPreview = async () => {
      setIsPreviewLoading(true);
      setPreviewError("");

      try {
        const pdfBlob = await getDocumentFile(numericDocumentId);
        const blobUrl = URL.createObjectURL(pdfBlob);

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        previewUrlRef.current = blobUrl;
        setPreviewUrl(blobUrl);
      } catch (err) {
        setPreviewError(
          err.response?.data?.detail ?? "Unable to load PDF preview."
        );
      } finally {
        setIsPreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
    };
  }, [numericDocumentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isSending ? "smooth" : "auto",
      block: "end",
    });
  }, [messages, isSending]);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 220);
    textareaRef.current.style.height = `${Math.max(nextHeight, 56)}px`;
  }, [query]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery || !activeDocument || activeDocument.status !== "indexed") {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedQuery,
    };
    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        sources: [],
      },
    ]);
    setQuery("");
    setIsSending(true);
    setError("");

    try {
      await streamDocumentQuestion({
        documentId: numericDocumentId,
        query: trimmedQuery,
        onEvent: (streamEvent) => {
          if (streamEvent.type === "sources") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? {
                    ...message,
                    sources: streamEvent.sources ?? [],
                  }
                  : message
              )
            );
            return;
          }

          if (streamEvent.type === "delta") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? {
                    ...message,
                    content: `${message.content}${streamEvent.content ?? ""}`,
                  }
                  : message
              )
            );
            return;
          }

          if (streamEvent.type === "done") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? {
                    ...message,
                    id: streamEvent.messageId ?? message.id,
                    sources: streamEvent.sources ?? message.sources ?? [],
                  }
                  : message
              )
            );
          }
        },
      });
    } catch (err) {
      setMessages((current) =>
        current.filter((message) => message.id !== assistantMessageId)
      );
      setError(err.message ?? "Unable to get an answer right now.");
    } finally {
      setIsSending(false);
    }
  };

  const introMessage = {
    id: "intro",
    role: "assistant",
    content:
      "Ask a question about this document and I'll answer from the indexed content.",
    sources: [],
  };

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = async () => {
    setShowClearConfirm(false);
    setIsClearingChat(true);
    setError("");

    try {
      await clearDocumentChatHistory(numericDocumentId);
      setMessages([introMessage]);
    } catch (err) {
      setError(err.response?.data?.detail ?? "Unable to clear chat history.");
    } finally {
      setIsClearingChat(false);
    }
  };

  const renderMessageRow = (message) => {
    const isUser = message.role === "user";

    return (
      <article
        key={message.id}
        className={`flex gap-3 sm:gap-4 rounded-[20px] sm:rounded-[26px] px-3 py-3 sm:px-5 sm:py-4 ${isUser ? "bg-white/[0.03]" : ""
          }`}
      >
        <div
          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] ${isUser
            ? "bg-white/10 text-zinc-200"
            : "bg-emerald-500/10 text-emerald-300"
            }`}
        >
          {isUser ? "You" : "AI"}
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <p className="whitespace-pre-wrap text-[13px] sm:text-sm leading-6 sm:leading-7 text-zinc-100">
            {message.content}
          </p>
        </div>
      </article>
    );
  };

  return (
    <div className="text-white h-full">
      <main className="flex h-screen w-full">
        <section className="flex w-full flex-1 min-h-0 overflow-hidden lg:border-l border-white/10 bg-[#0b0b0b]">
          <div
            className={`${isPreviewOpen ? "hidden lg:flex" : "flex"} min-w-0 flex-1 flex-col ${isPreviewOpen ? "lg:border-r lg:border-white/8" : ""
              }`}
          >
            {/* Header */}
            <div className="border-b border-white/8 bg-[#0d0d0d] px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex shrink-0 items-center justify-center h-9 w-9 lg:w-auto lg:px-0 lg:gap-2 text-sm text-zinc-400 transition hover:text-white rounded-xl lg:rounded-none bg-white/5 lg:bg-transparent"
                    title="Back to dashboard"
                  >
                    <ArrowLeft size={16} />
                    <span className="hidden lg:inline">Back to dashboard</span>
                  </Link>

                  <div className="hidden sm:block h-5 w-px shrink-0 bg-white/10" />

                  <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <MessageSquareText size={15} />
                  </div>

                  <h1 className="truncate text-sm font-semibold text-white sm:text-base lg:text-lg">
                    {activeDocument?.filename ?? "Chat"}
                  </h1>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  {activeDocument ? (
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.22em] ${activeDocument.status === "indexed"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : activeDocument.status === "processing"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                          : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                        }`}
                    >
                      {activeDocument.status}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleClearChat}
                    disabled={isSending || isClearingChat}
                    className="inline-flex h-8 w-8 sm:h-9 sm:w-auto sm:px-4 shrink-0 items-center justify-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-40"
                    title="Clear chat history"
                  >
                    {isClearingChat ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    <span className="hidden sm:inline text-xs font-bold">Clear</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen((current) => !current)}
                    className="inline-flex h-8 w-8 sm:h-9 sm:w-auto sm:px-4 shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
                    title={isPreviewOpen ? "Show Chat" : "Show PDF"}
                  >
                    {isPreviewOpen ? <EyeOff size={15} /> : <Eye size={15} />}
                    <span className="hidden sm:inline text-xs font-bold">
                      {isPreviewOpen ? "Hide PDF" : "PDF"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#0a0a0a] scroll-smooth">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-3 py-6 sm:px-6">
                {isLoadingDocument ? (
                  <div className="flex min-h-[36vh] items-center justify-center">
                    <LoaderCircle size={24} className="animate-spin text-zinc-400" />
                  </div>
                ) : (
                  messages.map(renderMessageRow)
                )}

                {error ? (
                  <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {error}
                  </p>
                ) : null}

                <div ref={messagesEndRef} className="h-32 shrink-0" />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/8 bg-[#0b0b0b] px-3 pb-4 pt-3 sm:px-6">
              <div className="mx-auto w-full max-w-4xl rounded-[24px] sm:rounded-[28px] border border-white/10 bg-[#121212] p-1.5 sm:p-2 shadow-xl">
                <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    rows={1}
                    disabled={isSending || !activeDocument || activeDocument.status !== "indexed"}
                    placeholder={activeDocument?.status === "indexed" ? "Ask something..." : "Indexing..."}
                    className="flex-1 max-h-[160px] sm:max-h-[220px] min-h-[48px] sm:min-h-[56px] resize-none overflow-y-auto rounded-[18px] sm:rounded-[22px] border border-white/8 bg-[#0b0b0b] px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/20 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={isSending || !query.trim() || !activeDocument || activeDocument.status !== "indexed"}
                    className="mb-1 inline-flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200 disabled:opacity-40"
                  >
                    {isSending ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <SendHorizonal size={18} />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* PDF Preview Sidebar */}
          {isPreviewOpen ? (
            <aside className="flex h-full min-h-0 w-full flex-1 flex-col bg-[#0f0f0f] lg:w-[min(40vw,560px)] lg:flex-none lg:shrink-0">
              <div className="flex items-center justify-between gap-4 border-b border-white/8 px-4 py-3 sm:px-5 sm:py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    PDF Panel
                  </p>
                  <h2 className="mt-0.5 truncate text-sm font-semibold text-white">
                    {activeDocument?.filename ?? "Preview"}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {previewUrl && (
                    <>
                      <a
                        href={previewUrl}
                        download={activeDocument?.filename ?? "document.pdf"}
                        className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-[10px] sm:text-xs font-bold text-zinc-200 hover:bg-white/10"
                      >
                        <FileDown size={14} />
                        <span className="hidden sm:inline">Save</span>
                      </a>
                      <button
                        onClick={() => setIsPreviewOpen(false)}
                        className="lg:hidden inline-flex h-8 items-center gap-2 rounded-full bg-white text-black px-3 text-[10px] font-bold"
                      >
                        Chat
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-[#111111] p-3 sm:p-4 overflow-hidden">
                <div className="flex h-full flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] bg-[#181818]">
                  <div className="min-h-0 flex-1 bg-[#1f1f1f]">
                    {isPreviewLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <LoaderCircle size={26} className="animate-spin text-zinc-400" />
                      </div>
                    ) : previewError ? (
                      <div className="flex h-full items-center justify-center p-6 text-center">
                        <p className="text-sm text-rose-400">{previewError}</p>
                      </div>
                    ) : (
                      <iframe
                        title="PDF Preview"
                        src={previewUrl}
                        className="h-full w-full bg-white border-none"
                      />
                    )}
                  </div>
                </div>
              </div>
            </aside>
          ) : null}
        </section>
      </main>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#131313] p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
              <Trash2 size={22} />
            </div>
            <h2 className="text-center font-bold text-white">Clear history?</h2>
            <p className="mt-2 text-center text-xs text-zinc-400">All messages will be lost forever.</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-2xl border border-white/10 py-2.5 text-xs font-bold hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearChat}
                className="flex-1 rounded-2xl bg-rose-600 py-2.5 text-xs font-bold text-white"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
