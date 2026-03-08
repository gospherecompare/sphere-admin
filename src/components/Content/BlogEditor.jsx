import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildUrl, getAuthToken } from "../../api";

const DEFAULT_TEMPLATE = [
  "{{product_name}} is powered by {{processor}} and features {{display}}.",
  "It comes with {{battery}} and {{main_camera}} for everyday usage.",
  "Current pricing is around {{price}}.",
].join("\n\n");

const DEFAULT_CUSTOM_TEMPLATE = [
  "Write your custom tech update here.",
  "Example: Weekly price drop alert for premium phones under 40,000.",
].join("\n\n");

const BlogEditor = () => {
  const [blogMode, setBlogMode] = useState("product");
  const [productType, setProductType] = useState("smartphone");
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tokenMap, setTokenMap] = useState({});
  const [tokenKeys, setTokenKeys] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [blogId, setBlogId] = useState(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [contentTemplate, setContentTemplate] = useState(DEFAULT_TEMPLATE);
  const [renderedContent, setRenderedContent] = useState("");
  const [unresolvedTokens, setUnresolvedTokens] = useState([]);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const contentRef = useRef(null);

  const authHeaders = useMemo(() => {
    const token = getAuthToken();
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }, []);

  const loadCandidates = async () => {
    setCandidatesLoading(true);
    setError("");
    try {
      const response = await fetch(
        buildUrl(`/api/admin/blogs/candidates?type=${encodeURIComponent(productType)}&limit=30`),
        { headers: authHeaders },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load blog candidates");
      }
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      setCandidates(rows);
      if (rows.length && !selectedProductId) {
        setSelectedProductId(rows[0].product_id);
      }
    } catch (err) {
      setError(err.message || "Failed to load blog candidates");
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const loadSuggestions = async (productId) => {
    if (!productId) return;
    setError("");
    try {
      const response = await fetch(
        buildUrl(`/api/admin/blogs/suggestions/${productId}`),
        { headers: authHeaders },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load suggestions");
      }

      const product = data?.product || null;
      const existing = data?.existing_blog || null;

      setSelectedProduct(product);
      setTokenMap(data?.token_map || {});
      setTokenKeys(Array.isArray(data?.token_keys) ? data.token_keys : []);
      setTemplates(Array.isArray(data?.suggestions) ? data.suggestions : []);

      if (existing) {
        setBlogId(existing.id || null);
        setTitle(existing.title || "");
        setSlug(existing.slug || "");
        setExcerpt(existing.excerpt || "");
        setMetaTitle(existing.meta_title || "");
        setMetaDescription(existing.meta_description || "");
        setHeroImage(existing.hero_image || product?.image || "");
        setStatus(existing.status === "published" ? "published" : "draft");
        setContentTemplate(existing.content_template || DEFAULT_TEMPLATE);
      } else {
        setBlogId(null);
        const productName = product?.name || "";
        setTitle(productName ? `${productName} - Specs, Price and Highlights` : "");
        setSlug("");
        setExcerpt("");
        setMetaTitle("");
        setMetaDescription("");
        setHeroImage(product?.image || "");
        setStatus("draft");
        setContentTemplate(DEFAULT_TEMPLATE);
      }
    } catch (err) {
      setError(err.message || "Failed to load product suggestions");
      setBlogId(null);
      setSelectedProduct(null);
      setTokenMap({});
      setTokenKeys([]);
      setTemplates([]);
      setHeroImage("");
    }
  };

  useEffect(() => {
    if (blogMode !== "product") return;
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogMode, productType]);

  useEffect(() => {
    if (blogMode !== "product") return;
    if (!selectedProductId) return;
    loadSuggestions(selectedProductId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogMode, selectedProductId]);

  useEffect(() => {
    if (blogMode === "product") return;
    setSelectedProductId(null);
    setSelectedProduct(null);
    setTokenMap({});
    setTokenKeys([]);
    setTemplates([]);
    setBlogId(null);
    setHeroImage("");
    setTitle("");
    setSlug("");
    setExcerpt("");
    setMetaTitle("");
    setMetaDescription("");
    setStatus("draft");
    setContentTemplate(DEFAULT_CUSTOM_TEMPLATE);
  }, [blogMode]);

  useEffect(() => {
    const canPreview =
      blogMode === "product"
        ? Boolean(selectedProductId && contentTemplate.trim())
        : Boolean(contentTemplate.trim());

    if (!canPreview) {
      setRenderedContent("");
      setUnresolvedTokens([]);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setError("");
      try {
        const response = await fetch(buildUrl("/api/admin/blogs/preview"), {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            product_id: blogMode === "product" ? selectedProductId : null,
            token_map: tokenMap,
            content: contentTemplate,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to render preview");
        }
        setRenderedContent(data?.rendered_content || "");
        setUnresolvedTokens(
          Array.isArray(data?.unresolved_tokens) ? data.unresolved_tokens : [],
        );
      } catch (err) {
        setError(err.message || "Failed to render preview");
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [authHeaders, blogMode, contentTemplate, selectedProductId, tokenMap]);

  const insertToken = (tokenKey) => {
    const token = `{{${tokenKey}}}`;
    const el = contentRef.current;
    if (!el) {
      setContentTemplate((prev) => `${prev}${prev ? "\n" : ""}${token}`);
      return;
    }

    const start = el.selectionStart ?? contentTemplate.length;
    const end = el.selectionEnd ?? contentTemplate.length;
    const next =
      contentTemplate.slice(0, start) + token + contentTemplate.slice(end);
    setContentTemplate(next);

    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + token.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const applyTemplate = (template) => {
    if (!template) return;
    setContentTemplate((prev) => {
      if (!prev.trim()) return template;
      return `${prev}\n\n${template}`;
    });
  };

  const saveBlog = async () => {
    const productIdForSave = blogMode === "product" ? selectedProductId : null;

    if (blogMode === "product" && !productIdForSave) {
      setError("Select a product first");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!contentTemplate.trim()) {
      setError("Blog content is required");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(buildUrl("/api/admin/blogs"), {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          blog_id: blogId || null,
          product_id: productIdForSave || null,
          title,
          slug,
          excerpt,
          meta_title: metaTitle,
          meta_description: metaDescription,
          hero_image: heroImage || null,
          status,
          content_template: contentTemplate,
          token_map: tokenMap,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to save blog");
      }
      setMessage("Blog saved successfully");
      if (data?.blog?.id) setBlogId(data.blog.id);
      if (data?.blog?.slug) setSlug(data.blog.slug);
      if (data?.blog?.hero_image) setHeroImage(data.blog.hero_image);
      if (Array.isArray(data?.unresolved_tokens)) {
        setUnresolvedTokens(data.unresolved_tokens);
      }
    } catch (err) {
      const rawMessage = String(err?.message || "Failed to save blog");
      if (/eligibility threshold/i.test(rawMessage)) {
        setError(
          "Connected API is using old blog eligibility rules. Switch admin API to the updated server and retry publish.",
        );
      } else {
        setError(rawMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const productImages = Array.isArray(selectedProduct?.images)
    ? selectedProduct.images.filter(Boolean)
    : [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:px-6">
      <div className="mb-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Blog Studio</h1>
            <p className="text-xs text-slate-600 mt-1">
              Publish product-linked or general blogs with live preview.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={blogMode}
              onChange={(event) => setBlogMode(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="product">Product-Linked Blog</option>
              <option value="general">General/Custom Blog</option>
            </select>
            {blogMode === "product" ? (
              <select
                value={productType}
                onChange={(event) => {
                  setSelectedProductId(null);
                  setProductType(event.target.value);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="smartphone">Smartphones</option>
                <option value="laptop">Laptops</option>
                <option value="tv">TVs</option>
              </select>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {blogMode === "product" ? (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Candidate Product
            </label>
            <select
              value={selectedProductId || ""}
              onChange={(event) => setSelectedProductId(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              disabled={candidatesLoading || candidates.length === 0}
            >
              {candidates.length === 0 ? (
                <option value="">
                  {candidatesLoading ? "Loading..." : "No candidates"}
                </option>
              ) : null}
              {candidates.map((row) => (
                <option key={row.product_id} value={row.product_id}>
                  {row.name} ({row.brand_name || "Brand"})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Product Snapshot
            </label>
            <div className="text-sm text-slate-700">
              <div className="font-semibold text-slate-900">{selectedProduct?.name || "-"}</div>
              <div>{selectedProduct?.brand_name || "-"}</div>
              <div>{selectedProduct?.price || "-"}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
          You are writing a custom blog. Only content and publish status matter.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="Blog title"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Slug
              </label>
              <input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="optional-custom-slug"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Excerpt
              </label>
              <input
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="Short excerpt for listing"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Meta Title
              </label>
              <input
                value={metaTitle}
                onChange={(event) => setMetaTitle(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="SEO title"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
              >
                <option value="draft">Draft</option>
                <option value="published">Publish</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Meta Description
              </label>
              <textarea
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="SEO description"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Hero Image URL
              </label>
              <input
                value={heroImage}
                onChange={(event) => setHeroImage(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="https://..."
              />
              {blogMode === "product" && productImages.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {productImages.slice(0, 6).map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setHeroImage(img)}
                      className="overflow-hidden rounded-md border border-slate-200 hover:border-indigo-300"
                      title="Use this image as hero"
                    >
                      <img src={img} alt={`product-${idx + 1}`} className="h-10 w-16 object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Content Template
          </label>
          <textarea
            ref={contentRef}
            value={contentTemplate}
            onChange={(event) => setContentTemplate(event.target.value)}
            rows={14}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
            placeholder="Write with tokens like {{processor}}"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveBlog}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Blog"}
            </button>
            {previewLoading ? (
              <span className="text-xs text-gray-500">Rendering preview...</span>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Tokens</h2>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {tokenKeys.length === 0 ? (
                <span className="text-xs text-slate-500">No tokens available</span>
              ) : (
                tokenKeys.map((tokenKey) => (
                  <button
                    key={tokenKey}
                    type="button"
                    onClick={() => insertToken(tokenKey)}
                    className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    {`{{${tokenKey}}}`}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              Suggested Lines
            </h2>
            <div className="space-y-2">
              {templates.length === 0 ? (
                <div className="text-xs text-slate-500">No suggestions</div>
              ) : (
                templates.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-200 p-2">
                    <div className="mb-1 text-xs text-slate-700">{item.rendered}</div>
                    <button
                      type="button"
                      onClick={() => applyTemplate(item.template)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Insert template
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Live Preview</h2>
            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-800 whitespace-pre-wrap">
              {renderedContent || "Preview will appear here"}
            </div>
            {unresolvedTokens.length ? (
              <div className="mt-2 text-xs text-amber-700">
                Missing tokens: {unresolvedTokens.join(", ")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
