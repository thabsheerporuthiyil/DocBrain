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
        className={`flex gap-4 rounded-[26px] px-4 py-4 sm:px-5 ${isUser ? "bg-white/[0.03]" : ""
          }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] ${isUser
            ? "bg-white/10 text-zinc-200"
            : "bg-emerald-500/10 text-emerald-300"
            }`}
        >
          {isUser ? "You" : "AI"}
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-100">
            {message.content}
          </p>

          {/* {!isUser &&
            Array.isArray(message.sources) &&
            message.sources.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <span
                  key={`${message.id}-${index}`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-zinc-300"
                >
                  Chunk {Number(source.chunk_index) + 1}
                </span>
              ))}
            </div>
          ) : null} */}
        </div>
      </article>
    );
  };

  return (
    <div className="text-white">

      <main className="mx-auto flex h-[calc(100vh-120px)] w-full max-w-[1680px]">
        <section className="flex w-full flex-1 min-h-0 overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0b0b] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          <div
            className={`${isPreviewOpen ? "hidden lg:flex" : "flex"} min-w-0 flex-1 flex-col ${isPreviewOpen ? "lg:border-r lg:border-white/8" : ""
              }`}
          >
            <div className="border-b border-white/8 bg-[#0d0d0d] px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex shrink-0 items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
                  >
                    <ArrowLeft size={15} />
                    Back to dashboard
                  </Link>

                  <div className="h-5 w-px shrink-0 bg-white/10" />

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <MessageSquareText size={15} />
                  </div>

                  <h1 className="truncate text-base font-semibold text-white sm:text-lg">
                    {activeDocument?.filename ?? "Document Chat"}
                  </h1>
                </div>

                <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                  {activeDocument ? (
                    <span
                      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${activeDocument.status === "indexed"
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
                    id="clear-chat-btn"
                    onClick={handleClearChat}
                    disabled={isSending || isClearingChat}
                    title="Clear chat history"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 transition hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isClearingChat ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    Clear chat
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen((current) => !current)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    {isPreviewOpen ? <EyeOff size={15} /> : <Eye size={15} />}
                    {isPreviewOpen
                      ? isDesktopPreview
                        ? "Hide PDF"
                        : "Back to chat"
                      : "Show PDF"}
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#0a0a0a]">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-3 py-6 sm:px-6">
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

                <div ref={messagesEndRef} className="h-40 shrink-0" />
              </div>
            </div>

            <div className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(11,11,11,0)_0%,#0b0b0b_20%)] px-3 pb-4 pt-3 sm:px-6 lg:sticky lg:bottom-0">
              <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#121212] p-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    rows={1}
                    disabled={
                      isSending ||
                      !activeDocument ||
                      activeDocument.status !== "indexed"
                    }
                    placeholder={
                      activeDocument?.status === "indexed"
                        ? "Ask a question about this PDF..."
                        : "This document must finish indexing before chat is available."
                    }
                    className="flex-1 max-h-[220px] min-h-14 resize-none overflow-y-auto rounded-[22px] border border-white/8 bg-[#0b0b0b] px-4 py-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20 focus:bg-[#101010] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="submit"
                    disabled={
                      isSending ||
                      !query.trim() ||
                      !activeDocument ||
                      activeDocument.status !== "indexed"
                    }
                    className="mb-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <SendHorizonal size={18} />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {isPreviewOpen ? (
            <aside className="flex h-full min-h-0 w-full flex-1 flex-col bg-[#0f0f0f] lg:w-[min(40vw,560px)] lg:flex-none lg:shrink-0">
              <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    PDF Panel
                  </p>
                  <h2 className="mt-1 truncate text-base font-semibold text-white">
                    {activeDocument?.filename ?? "Document preview"}
                  </h2>
                </div>

                {previewUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={previewUrl}
                      download={activeDocument?.filename ?? "document.pdf"}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                      <FileDown size={15} />
                      Download
                    </a>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink size={15} />
                      Open
                    </a>
                  </div>
                ) : null}
              </div>

              <div className="flex-1 bg-[#111111] p-4">
                <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#181818]">
                  <div className="flex items-center justify-between px-4 py-3 text-xs text-zinc-500">
                    <span className="uppercase tracking-[0.2em]">Preview</span>
                    <span>Reference pane</span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden bg-[#1f1f1f]">
                    {isPreviewLoading ? (
                      <div className="flex h-full min-h-[36vh] items-center justify-center">
                        <LoaderCircle
                          size={26}
                          className="animate-spin text-zinc-400"
                        />
                      </div>
                    ) : previewError ? (
                      <div className="flex h-full min-h-[36vh] items-center justify-center p-6">
                        <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-300">
                          {previewError}
                        </p>
                      </div>
                    ) : (
                      <iframe
                        title={activeDocument?.filename ?? "PDF Preview"}
                        src={previewUrl}
                        className="h-full w-full bg-white"
                      />
                    )}
                  </div>
                </div>
              </div>
            </aside>
          ) : null}
        </section>
      </main>
      {/* ── Clear-chat confirmation modal ── */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#131313] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
            style={{ animation: "modalIn 0.18s cubic-bezier(.22,.68,0,1.2) both" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
              <Trash2 size={22} className="text-rose-400" />
            </div>

            <h2 className="text-center text-base font-semibold text-white">
              Clear chat history?
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-zinc-400">
              All messages in this conversation will be permanently deleted.
              This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                id="clear-confirm-cancel"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                id="clear-confirm-ok"
                onClick={confirmClearChat}
                className="flex-1 rounded-2xl bg-rose-600 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500"
              >
                Yes, clear
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Chat;
