"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
type ChatRole = "user" | "model";

interface ChatMessage {
  role: ChatRole;
  text: string;
}

interface GeminiHistoryPart {
  role: ChatRole;
  parts: { text: string }[];
}

const SUGGESTED_PROMPTS = [
  "Compará los ingresos mes a mes",
  "¿Qué categoría generó más ingresos?",
  "¿Cuál es el motivo de cancelación más frecuente?",
  "Detectá anomalías y dame recomendaciones",
];

function toGeminiHistory(messages: ChatMessage[]): GeminiHistoryPart[] {
  const history: GeminiHistoryPart[] = [];

  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];

    if (current.role === "user" && next.role === "model") {
      history.push(
        { role: "user", parts: [{ text: current.text }] },
        { role: "model", parts: [{ text: next.text }] },
      );

      i++;
    }
  }

  return history.slice(-8);
}

export function AnalyticsChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, error]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: content }]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: toGeminiHistory(messages),
        }),
      });

      const raw = await res.text();

      let data: any = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        console.error("Respuesta no JSON de /api/chat:", raw);
        throw new Error(raw || "La API devolvió una respuesta inválida");
      }

      if (!res.ok) {
        console.error("Respuesta completa de /api/chat:", data);

        throw new Error(
          data.details ||
            data.error ||
            raw ||
            `Error HTTP ${res.status}`,
        );
      }

      if (!data.text) {
        console.error("Respuesta sin text de /api/chat:", data);
        throw new Error("La API no devolvió texto de respuesta");
      }

      setMessages((prev) => [...prev, { role: "model", text: data.text }]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "No se pudo obtener una respuesta. Probá de nuevo en unos segundos.";

      console.error("Error en AnalyticsChat:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <Button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[60] h-12 w-12 rounded-full bg-[#082B54] p-0 text-white shadow-lg hover:bg-[#061f3d]"
            aria-label="Abrir asistente de Analytics"
            >
            <Sparkles className="h-5 w-5" />
            </Button>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 z-[70] flex h-[min(520px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl sm:bottom-24 sm:right-6">
          <div className="flex items-center justify-between border-b bg-card px-4 py-3">
            <div className="flex items-center gap-2">
             <Sparkles className="h-4 w-4 text-[#082B54]" />
              <div>
                <p className="text-sm font-semibold leading-none">
                  Asistente de Analytics
                </p>
                <p className="text-xs text-muted-foreground">
                  Preguntá sobre tus métricas
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </Button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Puedo responder preguntas sobre KPIs, ingresos por mes,
                  ingresos por categoría, cancelaciones, profesionales y
                  diagnóstico avanzado usando los datos reales cargados.
                </p>

                <div className="flex flex-col gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                      className="rounded-lg border bg-muted/40 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  m.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>

                <div
                  className={`max-w-[260px] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.role === "model" ? (
            <ReactMarkdown
                components={{
                p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                    <ul className="ml-4 list-disc space-y-1">{children}</ul>
                ),
                li: ({ children }) => (
                    <li>{children}</li>
                ),
                strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                ),
                }}
            >
                {m.text}
            </ReactMarkdown>
            ) : (
            m.text
            )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Consultando datos...
              </div>
            )}

            {error && (
                <p className="whitespace-pre-wrap rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                    {error}
                </p>
                )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 border-t bg-card p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Preguntá algo sobre Analytics..."
              disabled={loading}
              className="h-9 text-sm"
            />

            <Button
                type="submit"
                size="sm"
                className="h-9 bg-[#082B54] px-3 text-white hover:bg-[#061f3d]"
                disabled={loading || !input.trim()}
                >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}