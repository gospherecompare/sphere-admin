import React, { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaLink,
  FaNewspaper,
  FaSave,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import {
  fetchLinkedNewsForProduct,
  normalizePositiveInteger,
  normalizePositiveIntegerList,
  saveProductNewsLinks,
  searchNewsArticles,
} from "../utils/productNewsLinks";
import {
  EditorStatusChip,
  editorGhostButtonClassName,
  editorPrimaryButtonClassName,
} from "./MobileEditorUi";

const FIELD_CLASS =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#345CFF] focus:bg-white focus:ring-0";

const GHOST_BUTTON_CLASS = `${editorGhostButtonClassName} rounded-md border-slate-200 bg-white shadow-none`;
const PRIMARY_BUTTON_CLASS = `${editorPrimaryButtonClassName} rounded-md border-[#4C35F2] bg-[#4C35F2] shadow-none`;

const toArticleRows = (value) => (Array.isArray(value) ? value : []);

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusTone = (status) => {
  if (status === "published") return "success";
  return "warning";
};

const ProductNewsAssignments = ({
  productId,
  productLabel = "product",
  selectedArticleIds: controlledSelectedArticleIds,
  onSelectedArticleIdsChange,
}) => {
  const normalizedProductId = normalizePositiveInteger(productId);
  const isEditMode = Boolean(normalizedProductId);
  const hasControlledSelection = Array.isArray(controlledSelectedArticleIds);
  const normalizedControlledSelection = useMemo(
    () => normalizePositiveIntegerList(controlledSelectedArticleIds),
    [controlledSelectedArticleIds],
  );

  const [linkedArticles, setLinkedArticles] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [internalSelectedArticleIds, setInternalSelectedArticleIds] = useState([]);
  const [articleCache, setArticleCache] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasHydratedSelection, setHasHydratedSelection] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedArticleIds = hasControlledSelection
    ? normalizedControlledSelection
    : internalSelectedArticleIds;

  const mergeArticleCache = (rows = []) => {
    setArticleCache((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        const rowId = normalizePositiveInteger(row?.id);
        if (!rowId) return;
        next[rowId] = {
          ...next[rowId],
          ...row,
        };
      });
      return next;
    });
  };

  const updateSelectedArticleIds = (nextValue) => {
    const normalizedIds = normalizePositiveIntegerList(nextValue);
    if (!hasControlledSelection) {
      setInternalSelectedArticleIds(normalizedIds);
    }
    if (typeof onSelectedArticleIdsChange === "function") {
      onSelectedArticleIdsChange(normalizedIds);
    }
  };

  const fetchLinkedNews = async (queryText = "", preserveSelection = false) => {
    setLoading(true);
    setError("");

    try {
      const data = isEditMode
        ? await fetchLinkedNewsForProduct(normalizedProductId, {
            query: queryText,
            limit: 12,
          })
        : await searchNewsArticles({
            query: queryText,
            limit: 12,
            selectedIds: selectedArticleIds,
          });

      const linked = isEditMode ? toArticleRows(data?.linked_articles) : [];
      const results = isEditMode
        ? toArticleRows(data?.search_results)
        : toArticleRows(data?.rows || data?.search_results);

      mergeArticleCache([...linked, ...results]);
      setLinkedArticles(linked);
      setSearchResults(results);

      if (isEditMode && (!preserveSelection || !hasHydratedSelection)) {
        updateSelectedArticleIds(
          linked
            .map((article) => normalizePositiveInteger(article?.id))
            .filter(Boolean),
        );
        setIsDirty(false);
        setHasHydratedSelection(true);
      }

      if (!isEditMode && !hasHydratedSelection) {
        setHasHydratedSelection(true);
      }
    } catch (fetchError) {
      console.error("Fetch linked news error:", fetchError);
      setLinkedArticles([]);
      setSearchResults([]);
      setError(fetchError.message || "Failed to load linked news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLinkedArticles([]);
    setSearchResults([]);
    setArticleCache({});
    setHasHydratedSelection(false);
    setIsDirty(false);
    setMessage("");
    setError("");
    if (!hasControlledSelection) {
      setInternalSelectedArticleIds([]);
    }
  }, [hasControlledSelection, normalizedProductId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchLinkedNews(searchQuery, isEditMode && (isDirty || hasHydratedSelection));
    }, 220);

    return () => window.clearTimeout(timer);
  }, [hasHydratedSelection, isDirty, isEditMode, normalizedProductId, searchQuery]);

  const selectedArticles = useMemo(
    () =>
      selectedArticleIds
        .map((articleId) => articleCache[articleId] || null)
        .filter(Boolean),
    [articleCache, selectedArticleIds],
  );

  const handleSelectToggle = (article) => {
    const articleId = normalizePositiveInteger(article?.id);
    if (!articleId) return;

    mergeArticleCache([article]);
    const nextSelectedIds = selectedArticleIds.includes(articleId)
      ? selectedArticleIds.filter((currentId) => currentId !== articleId)
      : [...selectedArticleIds, articleId];

    updateSelectedArticleIds(nextSelectedIds);
    if (isEditMode) {
      setIsDirty(true);
    }
    setMessage("");
    setError("");
  };

  const handleRemoveArticle = (articleIdToRemove) => {
    const normalizedArticleId = normalizePositiveInteger(articleIdToRemove);
    if (!normalizedArticleId) return;

    updateSelectedArticleIds(
      selectedArticleIds.filter((articleId) => articleId !== normalizedArticleId),
    );
    if (isEditMode) {
      setIsDirty(true);
    }
    setMessage("");
    setError("");
  };

  const handleSave = async () => {
    if (!isEditMode) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const data = await saveProductNewsLinks(
        normalizedProductId,
        selectedArticleIds,
      );

      const nextLinked = toArticleRows(data?.linked_articles);
      mergeArticleCache(nextLinked);
      setLinkedArticles(nextLinked);
      updateSelectedArticleIds(
        nextLinked
          .map((article) => normalizePositiveInteger(article?.id))
          .filter(Boolean),
      );
      setIsDirty(false);
      setMessage(
        data?.message ||
          `Linked news updated for this ${productLabel.toLowerCase()}.`,
      );
    } catch (saveError) {
      console.error("Save linked news error:", saveError);
      setError(saveError.message || "Failed to update linked news");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FaNewspaper className="text-sm text-[#4C35F2]" />
              <h2 className="text-lg font-semibold text-slate-950">
                Linked News Articles
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Search existing news stories and manually align multiple articles
              with this {productLabel.toLowerCase()}.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              Selected:{" "}
              <span className="font-semibold text-slate-900">
                {selectedArticleIds.length}
              </span>
            </span>
            {isEditMode ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className={PRIMARY_BUTTON_CLASS}
              >
                {saving ? (
                  <FaSpinner className="animate-spin text-sm" />
                ) : (
                  <FaSave className="text-sm" />
                )}
                <span>Save Linked News</span>
              </button>
            ) : (
              <span className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                Saved after create
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-5 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title, slug, primary product, or brand..."
              className={`${FIELD_CLASS} pl-10`}
            />
          </div>

          <button
            type="button"
            onClick={() => fetchLinkedNews(searchQuery, isEditMode && isDirty)}
            disabled={loading}
            className={GHOST_BUTTON_CLASS}
          >
            {loading ? (
              <FaSpinner className="animate-spin text-sm" />
            ) : (
              <FaSearch className="text-sm" />
            )}
            <span>Refresh Search</span>
          </button>
        </div>

        {!isEditMode ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            The selected articles will be linked automatically once this{" "}
            {productLabel.toLowerCase()} is created.
          </div>
        ) : null}

        {message ? (
          <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <FaCheckCircle className="mt-0.5 shrink-0" />
            <span className="flex-1">{message}</span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <FaExclamationCircle className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-md border border-slate-200 bg-slate-50/40">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <FaLink className="text-xs text-[#4C35F2]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Selected Articles
                </h3>
              </div>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-4">
              {selectedArticles.length ? (
                selectedArticles.map((article) => (
                  <article
                    key={`selected-article-${article.id}`}
                    className="rounded-md border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-semibold text-slate-900">
                          {article.title || "Untitled article"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {article.slug ? `/${article.slug}` : "No slug"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveArticle(article.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        title="Remove from linked news"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <EditorStatusChip
                        label={article.status === "published" ? "Published" : "Draft"}
                        tone={getStatusTone(article.status)}
                        className="rounded-md"
                      />
                      {article.primary_product_name ? (
                        <EditorStatusChip
                          label={`Primary: ${article.primary_product_name}`}
                          tone="info"
                          className="rounded-md"
                        />
                      ) : null}
                      {article.linked_product_count ? (
                        <EditorStatusChip
                          label={`${article.linked_product_count} linked products`}
                          tone="neutral"
                          className="rounded-md"
                        />
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Updated {formatDate(article.updated_at || article.published_at)}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  No news articles selected yet. Search on the right and tick the
                  articles you want to align.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {searchQuery.trim() ? "Search Results" : "Recent Articles"}
              </h3>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-4">
              {loading && !searchResults.length ? (
                <div className="py-10 text-center">
                  <FaSpinner className="mx-auto animate-spin text-2xl text-[#4C35F2]" />
                </div>
              ) : searchResults.length ? (
                searchResults.map((article) => {
                  const articleId = normalizePositiveInteger(article?.id);
                  const isSelected =
                    articleId && selectedArticleIds.includes(articleId);

                  return (
                    <article
                      key={`search-article-${article.id}`}
                      className={`rounded-md border px-4 py-3 transition ${
                        isSelected
                          ? "border-violet-200 bg-violet-50/60"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-semibold text-slate-900">
                            {article.title || "Untitled article"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {article.slug ? `/${article.slug}` : "No slug"}
                          </p>
                        </div>
                        <label
                          className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                            isSelected
                              ? "border-violet-200 bg-violet-100 text-violet-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(isSelected)}
                            onChange={() => handleSelectToggle(article)}
                            className="h-4 w-4 rounded border-slate-300 text-[#4C35F2] focus:ring-[#4C35F2]"
                          />
                          <span>{isSelected ? "Selected" : "Select"}</span>
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <EditorStatusChip
                          label={article.status === "published" ? "Published" : "Draft"}
                          tone={getStatusTone(article.status)}
                          className="rounded-md"
                        />
                        {article.primary_product_name ? (
                          <EditorStatusChip
                            label={`Primary: ${article.primary_product_name}`}
                            tone="neutral"
                            className="rounded-md"
                          />
                        ) : null}
                        {article.linked_product_count ? (
                          <EditorStatusChip
                            label={`${article.linked_product_count} linked products`}
                            tone="neutral"
                            className="rounded-md"
                          />
                        ) : null}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Updated {formatDate(article.updated_at || article.published_at)}
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {searchQuery.trim()
                    ? "No matching news articles were found for this search."
                    : "No recent news articles are available yet."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductNewsAssignments;
