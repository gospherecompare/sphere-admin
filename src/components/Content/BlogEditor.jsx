import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaLink,
  FaNewspaper,
  FaSearch,
  FaSyncAlt,
  FaUpload,
  FaTrashAlt,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import { uploadToCloudinary } from "../../config/cloudinary";

const DEFAULT_PRODUCT_TEMPLATE = [
  "{{product_name}} is powered by {{processor}} and features {{display}}.",
  "It comes with {{battery}} and {{main_camera}} for everyday usage.",
  "Current pricing is around {{price}}.",
].join("\n\n");

const DEFAULT_CUSTOM_TEMPLATE = [
  "Write your custom news update here.",
  "Example: Weekly mobile launch highlights and the gadgets worth tracking.",
].join("\n\n");

const PRODUCT_TYPE_LABELS = {
  smartphone: "Smartphones",
  laptop: "Laptops",
  tv: "TVs",
};

const STORY_CATEGORY_OPTIONS = [
  { value: "news", label: "News" },
  { value: "mobiles", label: "Mobiles" },
  { value: "gadgets", label: "Gadgets" },
  { value: "guides", label: "Guides" },
  { value: "launches", label: "Launches" },
];

const STATUS_BADGES = {
  draft: "border border-amber-200 bg-amber-50 text-amber-800",
  published: "border border-emerald-200 bg-emerald-50 text-emerald-800",
};

const HERO_IMAGE_SOURCE = {
  ASSET: "asset",
  URL: "url",
};

const normalizeHeroImageSource = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (text === "asset" || text === "product" || text === "product_asset")
    return HERO_IMAGE_SOURCE.ASSET;
  if (text === "url" || text === "upload" || text === "custom")
    return HERO_IMAGE_SOURCE.URL;
  return "";
};

const inferHeroImageSource = (heroImage, productImages = []) => {
  if (!heroImage) return HERO_IMAGE_SOURCE.URL;
  return Array.isArray(productImages) && productImages.includes(heroImage)
    ? HERO_IMAGE_SOURCE.ASSET
    : HERO_IMAGE_SOURCE.URL;
};

const toPlainObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  return {};
};

const normalizeImageSource = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value.trim();

  if (typeof value === "object") {
    const candidate = [
      value.url,
      value.src,
      value.image_url,
      value.image,
      value.cover_image,
      value.thumbnail,
      value.href,
    ].find((entry) => typeof entry === "string" && entry.trim());

    return candidate ? String(candidate).trim() : "";
  }

  return "";
};

const collectImageCandidates = (...inputs) => {
  const seen = new Set();
  const images = [];

  inputs.forEach((input) => {
    const values = Array.isArray(input) ? input : [input];
    values.forEach((value) => {
      const normalized = normalizeImageSource(value);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      images.push(normalized);
    });
  });

  return images;
};

const getFirstImageCandidate = (...inputs) =>
  collectImageCandidates(...inputs)[0] || "";

const formatDateLabel = (value) => {
  if (!value) return "Not updated yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

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
  const [heroImageSource, setHeroImageSource] = useState(
    HERO_IMAGE_SOURCE.ASSET,
  );
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [status, setStatus] = useState("draft");
  const [contentTemplate, setContentTemplate] = useState(
    DEFAULT_PRODUCT_TEMPLATE,
  );
  const [renderedContent, setRenderedContent] = useState("");
  const [unresolvedTokens, setUnresolvedTokens] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [libraryRows, setLibraryRows] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [libraryStatus, setLibraryStatus] = useState("all");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [selectedLibraryId, setSelectedLibraryId] = useState(null);
  const [loadingEntryId, setLoadingEntryId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const contentRef = useRef(null);
  const heroImageInputRef = useRef(null);
  const deferredLibraryQuery = useDeferredValue(libraryQuery);
  const deferredContentTemplate = useDeferredValue(contentTemplate);

  const authHeaders = useMemo(() => {
    const token = getAuthToken();
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }, []);

  const libraryStats = useMemo(() => {
    const total = libraryRows.length;
    const published = libraryRows.filter(
      (row) => row.status === "published",
    ).length;
    const draft = libraryRows.filter((row) => row.status === "draft").length;
    return { total, published, draft };
  }, [libraryRows]);

  const filteredLibrary = useMemo(() => {
    const query = String(deferredLibraryQuery || "")
      .trim()
      .toLowerCase();
    if (!query) return libraryRows;

    return libraryRows.filter((row) => {
      const haystack = [
        row.title,
        row.slug,
        row.product_name,
        row.brand_name,
        row.product_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [deferredLibraryQuery, libraryRows]);

  const activeEditorSummary = useMemo(() => {
    if (blogMode === "product") {
      return selectedProduct?.name || "Select a product to begin";
    }
    return title || "Draft a custom news or article entry";
  }, [blogMode, selectedProduct?.name, title]);

  const startNewProductStory = (nextType = productType) => {
    setError("");
    setMessage("Choose a product to start a linked story.");
    setBlogMode("product");
    setProductType(nextType);
    setBlogId(null);
    setSelectedLibraryId(null);
    setSelectedProductId(null);
    setSelectedProduct(null);
    setTokenMap({});
    setTokenKeys([]);
    setTemplates([]);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setMetaTitle("");
    setMetaDescription("");
    setHeroImage("");
    setHeroImageSource(HERO_IMAGE_SOURCE.ASSET);
    setUploadingHeroImage(false);
    setStatus("draft");
    setContentTemplate(DEFAULT_PRODUCT_TEMPLATE);
    setRenderedContent("");
    setUnresolvedTokens([]);
  };

  const startNewGeneralArticle = () => {
    setError("");
    setMessage("Ready for a new general article.");
    setBlogMode("general");
    setBlogId(null);
    setSelectedLibraryId(null);
    setSelectedProductId(null);
    setSelectedProduct(null);
    setTokenMap({});
    setTokenKeys([]);
    setTemplates([]);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setMetaTitle("");
    setMetaDescription("");
    setHeroImage("");
    setHeroImageSource(HERO_IMAGE_SOURCE.URL);
    setUploadingHeroImage(false);
    setStatus("draft");
    setContentTemplate(DEFAULT_CUSTOM_TEMPLATE);
    setRenderedContent("");
    setUnresolvedTokens([]);
  };

  const loadLibrary = async (nextStatus = libraryStatus) => {
    setLibraryLoading(true);
    setLibraryError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (nextStatus !== "all") params.set("status", nextStatus);

      const response = await fetch(
        buildUrl(`/api/admin/blogs?${params.toString()}`),
        {
          headers: authHeaders,
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load content library");
      }

      setLibraryRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (err) {
      setLibraryRows([]);
      setLibraryError(err.message || "Failed to load content library");
    } finally {
      setLibraryLoading(false);
    }
  };

  const loadCandidates = async (
    typeOverride = productType,
    preferredProductId = null,
  ) => {
    setCandidatesLoading(true);
    setError("");

    try {
      const response = await fetch(
        buildUrl(
          `/api/admin/blogs/candidates?type=${encodeURIComponent(typeOverride)}&limit=30`,
        ),
        { headers: authHeaders },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load story candidates");
      }

      const rows = Array.isArray(data?.rows) ? data.rows : [];
      setCandidates(rows);

      if (!rows.length) {
        setSelectedProductId(null);
        setSelectedProduct(null);
        return;
      }

      const preferredId =
        Number(preferredProductId || selectedProductId) || null;
      const hasPreferred = preferredId
        ? rows.some((row) => row.product_id === preferredId)
        : false;
      setSelectedProductId(hasPreferred ? preferredId : rows[0].product_id);
    } catch (err) {
      setError(err.message || "Failed to load story candidates");
      setCandidates([]);
      setSelectedProductId(null);
      setSelectedProduct(null);
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
        {
          headers: authHeaders,
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load story suggestions");
      }

      const product = data?.product || null;
      const existing = data?.existing_blog || null;

      setSelectedProduct(product);
      setTokenMap(data?.token_map || {});
      setTokenKeys(Array.isArray(data?.token_keys) ? data.token_keys : []);
      setTemplates(Array.isArray(data?.suggestions) ? data.suggestions : []);

      if (existing) {
        setBlogId(existing.id || null);
        setSelectedLibraryId(existing.id || null);
        setTitle(existing.title || "");
        setSlug(existing.slug || "");
        setExcerpt(existing.excerpt || "");
        setMetaTitle(existing.meta_title || "");
        setMetaDescription(existing.meta_description || "");
        const heroChoice =
          existing.hero_image ||
          getFirstImageCandidate(
            product?.hero_image,
            product?.image,
            product?.image_url,
            product?.cover_image,
            product?.thumbnail,
            product?.images,
          );
        const productImageChoices = collectImageCandidates(
          product?.hero_image,
          product?.image,
          product?.image_url,
          product?.cover_image,
          product?.thumbnail,
          product?.images,
        );
        setHeroImage(heroChoice);
        setHeroImageSource(
          normalizeHeroImageSource(existing.hero_image_source) ||
            inferHeroImageSource(heroChoice, productImageChoices),
        );
        setStatus(existing.status === "published" ? "published" : "draft");
        setContentTemplate(
          existing.content_template || DEFAULT_PRODUCT_TEMPLATE,
        );
        setRenderedContent(existing.content_rendered || "");
        setMessage("Loaded saved product-linked story.");
      } else {
        const productName = product?.name || "";
        setBlogId(null);
        setSelectedLibraryId(null);
        setTitle(
          productName ? `${productName} - Specs, Price and Highlights` : "",
        );
        setSlug("");
        setExcerpt("");
        setMetaTitle("");
        setMetaDescription("");
        const heroChoice = getFirstImageCandidate(
          product?.hero_image,
          product?.image,
          product?.image_url,
          product?.cover_image,
          product?.thumbnail,
          product?.images,
        );
        setHeroImage(heroChoice);
        setHeroImageSource(
          inferHeroImageSource(
            heroChoice,
            collectImageCandidates(
              product?.hero_image,
              product?.image,
              product?.image_url,
              product?.cover_image,
              product?.thumbnail,
              product?.images,
            ),
          ),
        );
        setStatus("draft");
        setContentTemplate(DEFAULT_PRODUCT_TEMPLATE);
        setRenderedContent("");
        setMessage("Ready to draft a new product-linked story.");
      }
    } catch (err) {
      setError(err.message || "Failed to load product suggestions");
      setBlogId(null);
      setSelectedLibraryId(null);
      setSelectedProduct(null);
      setTokenMap({});
      setTokenKeys([]);
      setTemplates([]);
      setHeroImage("");
    }
  };

  const handleHeroImageUpload = async (file) => {
    if (!file) return;

    setUploadingHeroImage(true);
    setError("");

    try {
      const data = await uploadToCloudinary(file, "banners", {
        resourceType: "image",
      });

      if (!data?.secure_url) {
        throw new Error("No secure_url returned from upload");
      }

      setHeroImage(data.secure_url);
      setHeroImageSource(HERO_IMAGE_SOURCE.URL);
      setMessage("Hero image uploaded successfully.");
    } catch (err) {
      setError(err?.message || "Failed to upload hero image");
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const loadGeneralArticle = async (articleId) => {
    if (!articleId) return;

    setLoadingEntryId(articleId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(buildUrl(`/api/admin/blogs/${articleId}`), {
        headers: authHeaders,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load article");
      }

      const article = data?.blog || null;
      if (!article) throw new Error("Article not found");

      const nextTokenMap = toPlainObject(article.token_snapshot);
      setBlogMode("general");
      setSelectedLibraryId(article.id || null);
      setBlogId(article.id || null);
      setSelectedProductId(null);
      setSelectedProduct(null);
      setTokenMap(nextTokenMap);
      setTokenKeys(Object.keys(nextTokenMap).sort());
      setTemplates([]);
      setTitle(article.title || "");
      setSlug(article.slug || "");
      setExcerpt(article.excerpt || "");
      setMetaTitle(article.meta_title || "");
      setMetaDescription(article.meta_description || "");
      setHeroImage(article.hero_image || "");
      setHeroImageSource(
        normalizeHeroImageSource(article.hero_image_source) ||
          HERO_IMAGE_SOURCE.URL,
      );
      setStatus(article.status === "published" ? "published" : "draft");
      setContentTemplate(article.content_template || DEFAULT_CUSTOM_TEMPLATE);
      setRenderedContent(article.content_rendered || "");
      setUnresolvedTokens([]);
      setMessage("Loaded saved article.");
    } catch (err) {
      setError(err.message || "Failed to load article");
    } finally {
      setLoadingEntryId(null);
    }
  };

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryStatus]);

  useEffect(() => {
    if (blogMode !== "product") return;
    loadCandidates(productType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogMode, productType]);

  useEffect(() => {
    if (blogMode !== "product" || !selectedProductId) return;
    loadSuggestions(selectedProductId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogMode, selectedProductId]);

  useEffect(() => {
    const canPreview =
      blogMode === "product"
        ? Boolean(selectedProductId && deferredContentTemplate.trim())
        : Boolean(deferredContentTemplate.trim());

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
            content: deferredContentTemplate,
          }),
        });
        const data = await response.json().catch(() => ({}));

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
  }, [
    authHeaders,
    blogMode,
    deferredContentTemplate,
    selectedProductId,
    tokenMap,
  ]);

  const insertToken = (tokenKey) => {
    const token = `{{${tokenKey}}}`;
    const element = contentRef.current;

    if (!element) {
      setContentTemplate((prev) => `${prev}${prev ? "\n" : ""}${token}`);
      return;
    }

    const start = element.selectionStart ?? contentTemplate.length;
    const end = element.selectionEnd ?? contentTemplate.length;
    const nextValue =
      contentTemplate.slice(0, start) + token + contentTemplate.slice(end);
    setContentTemplate(nextValue);

    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + token.length;
      element.setSelectionRange(cursor, cursor);
    });
  };

  const applyTemplate = (template) => {
    if (!template) return;
    setContentTemplate((prev) =>
      prev.trim() ? `${prev}\n\n${template}` : template,
    );
  };

  const saveBlog = async () => {
    const productIdForSave = blogMode === "product" ? selectedProductId : null;
    const productImageChoices =
      blogMode === "product"
        ? collectImageCandidates(
            selectedProduct?.hero_image,
            selectedProduct?.image,
            selectedProduct?.image_url,
            selectedProduct?.cover_image,
            selectedProduct?.thumbnail,
            selectedProduct?.images,
          )
        : [];
    const effectiveHeroImageSource =
      blogMode === "product"
        ? normalizeHeroImageSource(heroImageSource) ||
          inferHeroImageSource(heroImage, productImageChoices)
        : HERO_IMAGE_SOURCE.URL;

    if (blogMode === "product" && !productIdForSave) {
      setError("Select a product first");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!contentTemplate.trim()) {
      setError("Content is required");
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
          hero_image_source: effectiveHeroImageSource,
          status,
          content_template: contentTemplate,
          token_map: tokenMap,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save content");
      }

      setMessage(
        status === "published"
          ? "Content published successfully"
          : "Draft saved successfully",
      );
      if (data?.blog?.id) {
        setBlogId(data.blog.id);
        setSelectedLibraryId(data.blog.id);
      }
      if (data?.blog?.slug) setSlug(data.blog.slug);
      if (data?.blog?.hero_image) setHeroImage(data.blog.hero_image);
      if (data?.blog?.hero_image_source) {
        setHeroImageSource(normalizeHeroImageSource(data.blog.hero_image_source));
      }
      if (data?.blog?.content_rendered)
        setRenderedContent(data.blog.content_rendered);
      if (Array.isArray(data?.unresolved_tokens)) {
        setUnresolvedTokens(data.unresolved_tokens);
      }

      await loadLibrary(libraryStatus);
    } catch (err) {
      const rawMessage = String(err?.message || "Failed to save content");
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

  const deleteBlog = async (row) => {
    const targetId = Number(row?.id);
    if (!Number.isInteger(targetId) || targetId <= 0) return;

    const targetLabel = row?.title || "this entry";
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete "${targetLabel}"? This action cannot be undone.`)
    ) {
      return;
    }

    setDeletingId(targetId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(buildUrl(`/api/admin/blogs/${targetId}`), {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete content");
      }

      const isCurrentEntry =
        blogId === targetId || selectedLibraryId === targetId;

      if (isCurrentEntry && row?.product_id) {
        setBlogMode("product");
        setProductType(row.product_type || "smartphone");
        setSelectedLibraryId(null);
        setBlogId(null);
        setSelectedProductId(Number(row.product_id));
        await loadSuggestions(Number(row.product_id));
        setMessage("Deleted saved story. You can continue with a fresh draft.");
      } else if (isCurrentEntry) {
        startNewGeneralArticle();
        setMessage("Deleted saved article. Ready for a new draft.");
      } else {
        setMessage("Content deleted successfully.");
      }

      await loadLibrary(libraryStatus);
    } catch (err) {
      setError(err.message || "Failed to delete content");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLibrarySelect = (row) => {
    if (!row?.id) return;

    if (row.product_id) {
      setError("");
      setMessage("Loading selected story...");
      setSelectedLibraryId(row.id);
      setBlogMode("product");
      setProductType(row.product_type || "smartphone");
      setSelectedProductId(Number(row.product_id));
      return;
    }

    void loadGeneralArticle(Number(row.id));
  };

  const productImages = useMemo(
    () =>
      collectImageCandidates(
        selectedProduct?.hero_image,
        selectedProduct?.image,
        selectedProduct?.image_url,
        selectedProduct?.cover_image,
        selectedProduct?.thumbnail,
        selectedProduct?.images,
      ),
    [selectedProduct],
  );
  const heroImageChoices = useMemo(
    () =>
      blogMode === "product" &&
      heroImageSource === HERO_IMAGE_SOURCE.ASSET
        ? collectImageCandidates(productImages, heroImage)
        : [],
    [blogMode, heroImage, heroImageSource, productImages],
  );

  const currentModeLabel =
    blogMode === "product" ? "Product-linked story" : "General article";
  const currentReference =
    blogMode === "product"
      ? selectedProduct?.brand_name && selectedProduct?.name
        ? `${selectedProduct.brand_name} ${selectedProduct.name}`
        : selectedProduct?.name || "No product selected"
      : slug
        ? `/${slug}`
        : "Slug will be generated when you save";
  const currentModeHelp =
    blogMode === "product"
      ? selectedProductId
        ? "Product details and editorial helpers are loaded in the right rail."
        : "Choose a product first to preload specs, hero image options, and suggested lines."
      : "Use this mode for explainers, launch roundups, and general newsroom posts.";
  const overviewCards = [
    {
      label: "Library Items",
      value: libraryStats.total,
      hint: "Saved stories and articles",
      cardClassName: "border-slate-200 bg-white",
      labelClassName: "text-slate-500",
      valueClassName: "text-slate-900",
    },
    {
      label: "Drafts",
      value: libraryStats.draft,
      hint: "Needs review or publish",
      cardClassName: "border-amber-200 bg-amber-50",
      labelClassName: "text-amber-700",
      valueClassName: "text-amber-900",
    },
    {
      label: "Published",
      value: libraryStats.published,
      hint: "Live in the newsroom",
      cardClassName: "border-emerald-200 bg-emerald-50",
      labelClassName: "text-emerald-700",
      valueClassName: "text-emerald-900",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
      <div className="mb-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <FaNewspaper className="text-base" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                News & Articles Studio
              </h1>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                Manage product-linked stories and general editorial content from
                one admin workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => startNewGeneralArticle()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              New Article
            </button>
            <button
              type="button"
              onClick={() => startNewProductStory()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <FaLink className="text-xs" />
              New Product Story
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {overviewCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-lg border px-4 py-3 ${card.cardClassName}`}
            >
              <div
                className={`text-xs font-semibold uppercase tracking-wide ${card.labelClassName}`}
              >
                {card.label}
              </div>
              <div
                className={`mt-2 text-2xl font-semibold ${card.valueClassName}`}
              >
                {card.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">{card.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Content Library
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Review saved entries and reopen any story or article in the
                editor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={libraryStatus}
                onChange={(event) => setLibraryStatus(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft only</option>
                <option value="published">Published only</option>
              </select>
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  value={libraryQuery}
                  onChange={(event) => setLibraryQuery(event.target.value)}
                  placeholder="Search title, slug, brand..."
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-800 sm:w-64"
                />
              </div>
              <button
                type="button"
                onClick={() => loadLibrary(libraryStatus)}
                disabled={libraryLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
              >
                <FaSyncAlt
                  className={
                    libraryLoading ? "animate-spin text-xs" : "text-xs"
                  }
                />
                Refresh
              </button>
            </div>
          </div>

          {libraryError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {libraryError}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span>
              Showing {filteredLibrary.length} of {libraryStats.total} saved
              items
            </span>
            <span>
              {libraryLoading ? "Refreshing library..." : "Latest first"}
            </span>
          </div>

          <div className="mt-3 hidden rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_140px_168px]">
            <span>Title</span>
            <span>Type & Reference</span>
            <span>Updated</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="mt-3 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {libraryLoading && libraryRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Loading content library...
              </div>
            ) : filteredLibrary.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No content matches the current filter.
              </div>
            ) : (
              filteredLibrary.map((row) => (
                <div
                  key={row.id}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                    selectedLibraryId === row.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_140px_168px] lg:items-center">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">
                        {row.title || "Untitled content"}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        {row.slug || "Slug will be generated on save"}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                            STATUS_BADGES[row.status] || STATUS_BADGES.draft
                          }`}
                        >
                          {row.status || "draft"}
                        </span>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {row.product_id
                            ? `Product-linked ${PRODUCT_TYPE_LABELS[row.product_type] || "story"}`
                            : "General article"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-600">
                        {row.product_name || "Standalone editorial"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {row.brand_name || "No brand assigned"}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">
                        {formatDateLabel(row.updated_at)}
                      </div>
                      <div className="mt-1 text-slate-500">ID {row.id}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => handleLibrarySelect(row)}
                        disabled={
                          loadingEntryId === row.id || deletingId === row.id
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {loadingEntryId === row.id ? "Loading..." : "Open"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBlog(row)}
                        disabled={
                          deletingId === row.id || loadingEntryId === row.id
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-100 disabled:opacity-60"
                      >
                        <FaTrashAlt className="text-[11px]" />
                        {deletingId === row.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Workspace Summary
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {activeEditorSummary}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {currentModeLabel}
                {blogId ? ` - ID ${blogId}` : " - New draft"}
              </div>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                STATUS_BADGES[status] || STATUS_BADGES.draft
              }`}
            >
              {status}
            </span>
          </div>

          {message ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Current Mode
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {currentModeLabel}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Current Reference
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {currentReference}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              What To Do Next
            </div>
            <div className="mt-2 text-sm text-slate-700">{currentModeHelp}</div>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div>1. Pick the content mode and source.</div>
              <div>2. Fill the title, excerpt, and publishing details.</div>
              <div>3. Review preview, then save draft or publish.</div>
            </div>
            {blogId ? (
              <button
                type="button"
                onClick={() =>
                  deleteBlog({
                    id: blogId,
                    title,
                    product_id:
                      blogMode === "product" ? selectedProductId : null,
                    product_type: blogMode === "product" ? productType : null,
                  })
                }
                disabled={deletingId === blogId}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-100 disabled:opacity-60"
              >
                <FaTrashAlt className="text-[11px]" />
                {deletingId === blogId
                  ? "Deleting entry..."
                  : "Delete current entry"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Editorial Composer
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Build SEO-ready content with preview and publishing controls.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={blogMode}
              onChange={(event) => {
                if (event.target.value === "product") {
                  startNewProductStory(productType);
                } else {
                  startNewGeneralArticle();
                }
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="product">Product-Linked Story</option>
              <option value="general">General Article</option>
            </select>
            {blogMode === "product" ? (
              <select
                value={productType}
                onChange={(event) => startNewProductStory(event.target.value)}
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

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Story Entry
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Write the story the way it should read to users. Publishing and
              SEO settings support the entry instead of driving it.
            </p>
          </div>

          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Story Basics
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Headline
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  placeholder="Enter the main story headline"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  URL Slug
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
                  Standfirst / Summary
                </label>
                <input
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  placeholder="Short summary for cards, listings, and article intro"
                />
              </div>
            </div>
          </div>

          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Search & Publishing
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  SEO Title
                </label>
                <input
                  value={metaTitle}
                  onChange={(event) => setMetaTitle(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  placeholder="Title used for search engines"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Publish State
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
                  SEO Description
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(event) => setMetaDescription(event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  placeholder="Short description used in search previews"
                />
              </div>
            </div>
          </div>

          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Story Body
          </div>
          <p className="mb-2 text-xs text-slate-600">
            This is the main article text. Write it naturally, and use product
            facts or suggested blocks from the right side only when they help.
          </p>
          <textarea
            ref={contentRef}
            value={contentTemplate}
            onChange={(event) => setContentTemplate(event.target.value)}
            rows={18}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm leading-6 text-slate-800"
            placeholder="Write the full story body here. Start with the lead paragraph, then continue with details, context, and the closing takeaway."
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveBlog}
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Story"}
            </button>
            {previewLoading ? (
              <span className="text-xs text-gray-500">
                Rendering preview...
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Source & Assets
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Pick the story source, review the content reference, and control
              the hero image from here.
            </p>

            {blogMode === "product" ? (
              <>
                <label className="mt-4 mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Candidate Product
                </label>
                <select
                  value={selectedProductId || ""}
                  onChange={(event) =>
                    setSelectedProductId(Number(event.target.value))
                  }
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

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Product Snapshot
                  </div>
                  <div className="mt-2 font-semibold text-slate-900">
                    {selectedProduct?.name || "-"}
                  </div>
                  <div className="mt-1">
                    {selectedProduct?.brand_name || "-"}
                  </div>
                  <div className="mt-1">{selectedProduct?.price || "-"}</div>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-800">
                General article mode is ideal for launch roundups, trend
                reports, and custom newsroom posts.
              </div>
            )}

            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hero Image
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Choose an attached product image or switch to a custom URL for
                a fresh cover. We store the source with the blog.
              </p>

              {blogMode === "product" ? (
                <div className="mt-3 inline-flex overflow-hidden rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setHeroImageSource(HERO_IMAGE_SOURCE.ASSET)}
                    className={`px-3 py-2 ${
                      heroImageSource === HERO_IMAGE_SOURCE.ASSET
                        ? "bg-slate-900 text-white"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    Product assets
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroImageSource(HERO_IMAGE_SOURCE.URL)}
                    className={`px-3 py-2 ${
                      heroImageSource === HERO_IMAGE_SOURCE.URL
                        ? "bg-slate-900 text-white"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    Custom URL / upload
                  </button>
                </div>
              ) : null}

              {heroImage ? (
                <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  <img
                    src={heroImage}
                    alt="Selected hero"
                    className="h-36 w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
                    <span>
                      Current hero image
                      {blogMode === "product" ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">
                          ({heroImageSource === HERO_IMAGE_SOURCE.ASSET
                            ? "Product asset"
                            : "Custom URL"})
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHeroImage("")}
                      className="font-semibold text-slate-500 hover:text-slate-900"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                  No hero image selected yet.
                </div>
              )}

              {blogMode === "product" &&
              heroImageSource === HERO_IMAGE_SOURCE.ASSET ? (
                heroImageChoices.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Select from product images
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {heroImageChoices.map((img, idx) => {
                        const selected = heroImage === img;
                        return (
                          <button
                            key={`${img}-${idx}`}
                            type="button"
                            onClick={() => {
                              setHeroImage(img);
                              setHeroImageSource(HERO_IMAGE_SOURCE.ASSET);
                            }}
                            className={`overflow-hidden rounded-md border text-left transition ${
                              selected
                                ? "border-slate-900 ring-1 ring-slate-900"
                                : "border-slate-200 hover:border-slate-400"
                            }`}
                          >
                            <img
                              src={img}
                              alt={`product-${idx + 1}`}
                              className="h-20 w-full object-cover"
                            />
                            <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600">
                              <span>{selected ? "Selected" : "Use image"}</span>
                              <span>#{idx + 1}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                    No product images are attached yet. Add images to the
                    product first, then select one here. You can still switch
                    to a custom URL below.
                  </div>
                )
              ) : (
                <div className="mt-4 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={heroImage}
                      onChange={(event) => {
                        setHeroImage(event.target.value);
                        setHeroImageSource(HERO_IMAGE_SOURCE.URL);
                      }}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                      placeholder="https://example.com/article-image.jpg"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => heroImageInputRef.current?.click()}
                      disabled={uploadingHeroImage}
                      className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      <FaUpload className="text-[11px]" />
                      {uploadingHeroImage ? "Uploading..." : "Upload image"}
                    </button>
                    <input
                      ref={heroImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0] || null;
                        await handleHeroImageUpload(file);
                        event.target.value = "";
                      }}
                    />
                    {heroImage ? (
                      <button
                        type="button"
                        onClick={() => setHeroImage("")}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>

                  <div className="text-[11px] leading-5 text-slate-500">
                    Use this for blogs and news articles when you want a fresh
                    cover image instead of a product image.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              Live Preview
            </h2>
            <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-800">
              {renderedContent || "Preview will appear here"}
            </div>
            {unresolvedTokens.length ? (
              <div className="mt-2 text-xs text-amber-700">
                Missing product facts: {unresolvedTokens.join(", ")}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              Product Facts
            </h2>
            <p className="mb-3 text-xs text-slate-600">
              Insert product-specific facts into the story body when you need
              them. These are most useful for product-linked stories.
            </p>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {blogMode !== "product" ? (
                <span className="text-xs text-slate-500">
                  Switch to a product-linked story to use dynamic product facts.
                </span>
              ) : tokenKeys.length === 0 ? (
                <span className="text-xs text-slate-500">
                  No product facts available
                </span>
              ) : (
                tokenKeys.map((tokenKey) => (
                  <button
                    key={tokenKey}
                    type="button"
                    onClick={() => insertToken(tokenKey)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  >
                    {`{{${tokenKey}}}`}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              Suggested Story Blocks
            </h2>
            <p className="mb-3 text-xs text-slate-600">
              Use these as optional editorial building blocks, then rewrite them
              as needed to match your article tone.
            </p>
            <div className="space-y-2">
              {templates.length === 0 ? (
                <div className="text-xs text-slate-500">
                  No story blocks available
                </div>
              ) : (
                templates.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-slate-200 p-2"
                  >
                    <div className="mb-1 text-xs text-slate-700">
                      {item.rendered}
                    </div>
                    <button
                      type="button"
                      onClick={() => applyTemplate(item.template)}
                      className="text-xs font-semibold text-slate-900 hover:text-slate-700"
                    >
                      Insert block
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
