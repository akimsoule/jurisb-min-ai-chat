import { BookOpen, Copy, Check, ScrollText } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Source {
  title: string;
  article: string;
  lawNumber?: string;
  lawDate?: string;
  source?: string;
}

interface ChatMessageProps {
  readonly message: {
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
    timestamp: Date;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-md lg:max-w-lg">
          <div className="rounded-lg bg-base-200 px-4 py-3 text-sm text-base-content overflow-x-hidden">
            <p className="line-clamp-2 break-words overflow-hidden">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex mb-6">
      {/* Content */}
      <div className="flex-1 max-w-lg lg:max-w-2xl">
        {/* Main Message (Markdown rendered) */}
        {message.content && message.content.trim().length > 0 ? (
          <div className="prose prose-sm max-w-none text-base-content text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span>📘</span>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>📑</span>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-base-content/90">
                    <span>⚖️</span>
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold flex items-center gap-2 text-base-content/70">
                    <span>🔎</span>
                    {children}
                  </h4>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-base-content">
                    {children}
                  </strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-base-300 pl-3 py-2 bg-base-200 rounded-md text-base-content/90">
                    <div className="flex items-start gap-2">
                      <ScrollText className="w-3 h-3 text-base-content/60 mt-1" />
                      <div>{children}</div>
                    </div>
                  </blockquote>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc ml-5 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal ml-5 space-y-1">{children}</ol>
                ),
                hr: () => <hr className="my-4 border-base-300" />,
                p: ({ children }) => (
                  <p className="leading-relaxed">{children}</p>
                ),
                code: ({ children }) => (
                  <code className="px-1 py-0.5 rounded bg-base-300 text-base-content/90">
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : null}

        {/* Sources (groupées par loi) */}
        {message.sources &&
          message.sources.length > 0 &&
          (() => {
            type Group = {
              title: string;
              lawNumber?: string;
              lawDate?: string;
              source?: string;
              articles: string[];
            };
            const map = new Map<string, Group>();
            for (const s of message.sources) {
              const key = `${s.title}__${s.lawNumber ?? ""}`;
              if (!map.has(key)) {
                map.set(key, {
                  title: s.title,
                  lawNumber: s.lawNumber,
                  lawDate: s.lawDate,
                  source: s.source,
                  articles: [],
                });
              }
              const g = map.get(key)!;
              if (s.article && !g.articles.includes(s.article)) {
                g.articles.push(s.article);
              }
            }
            const groups = Array.from(map.values()).map((g) => {
              const articlesSorted = [...g.articles].sort((a, b) => {
                const ai =
                  Number.parseInt(String(a).replaceAll(/\D+/g, "")) || 0;
                const bi =
                  Number.parseInt(String(b).replaceAll(/\D+/g, "")) || 0;
                return ai - bi;
              });
              return { ...g, articles: articlesSorted };
            });
            return (
              <div className="mt-4 space-y-2 bg-base-100 rounded-lg p-3 border border-base-300 overflow-x-hidden">
                <h4 className="font-semibold text-xs text-base-content/80 flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  Fondement légal
                </h4>
                <ul className="space-y-2">
                  {groups.map((g) => {
                    const itemKey = `${g.title}-${g.lawNumber ?? ""}-${g.articles.join("_")}`;
                    const lawLabel =
                      `loi n° ${g.lawNumber ?? ""}${g.lawDate ? ` - ${g.lawDate}` : ""}`.trim();
                    const cleanArticle = (a: string) =>
                      a.replace(/^\s*(articles?|art\.)\s*/i, "").trim();
                    const displayArticles = Array.from(
                      new Set(g.articles.map((a) => cleanArticle(a))),
                    );
                    return (
                      <li
                        key={itemKey}
                        className="text-xs text-base-content/80"
                      >
                        <p className="font-medium text-base-content line-clamp-2 break-words overflow-hidden">
                          {displayArticles.length > 1
                            ? "Articles "
                            : "Article "}
                          {displayArticles.join(", ")}
                        </p>
                        <p className="text-base-content/70 line-clamp-2 break-words overflow-hidden">
                          {g.title}
                        </p>
                        {(g.lawNumber || g.source || g.lawDate) && (
                          <p className="text-base-content/70 line-clamp-2 break-words overflow-hidden">
                            {g.source ? (
                              <a
                                href={g.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-base-content/70 hover:text-base-content underline line-clamp-2 break-words overflow-hidden"
                              >
                                {`Source : ${lawLabel}`}
                              </a>
                            ) : (
                              <>Source : {lawLabel}</>
                            )}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}

        {/* Actions */}
        <div className="mt-3">
          <button
            onClick={handleCopy}
            className="text-xs text-base-content/60 hover:text-base-content/80 flex items-center gap-1 transition-colors"
            title="Copier"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copié
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copier
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
