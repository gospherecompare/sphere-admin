import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Cookies from "js-cookie";
import {
  FaLink,
  FaNewspaper,
  FaSearch,
  FaSyncAlt,
  FaUpload,
  FaTrashAlt,
  FaTag,
  FaCalendarAlt,
  FaImage,
  FaUser,
  FaThumbtack,
  FaFire,
  FaStar,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import { uploadToCloudinary } from "../../config/cloudinary";
import { getAuthorOptions, syncRbacState } from "../../utils/rbacStore";

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

const getDefaultAuthorName = () => {
  try {
    return String(Cookies.get("username") || "").trim();
  } catch {
    return "";
  }
};

const parseCommaSeparatedList = (value) =>
  Array.from(
    new Set(
      String(value || "")
        .split(/[,;\n]+/)
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  );

const formatCommaSeparatedList = (values = []) =>
  Array.isArray(values) ? values.join(", ") : "";

const getDefaultStoryCategory = (mode = "general") =>
  mode === "product" ? "launches" : "news";

const normalizeBlogTags = (value) => {
  if (Array.isArray(value)) {
    return parseCommaSeparatedList(value.join(", "));
  }

  if (typeof value === "string") {
    return parseCommaSeparatedList(value);
  }

  if (value && typeof value === "object") {
    return parseCommaSeparatedList(value.tags || value.keywords || "");
  }

  return [];
};

const tagsToInputValue = (value) => formatCommaSeparatedList(normalizeBlogTags(value));

const normalizeBoolean = (value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return ["1", "true", "yes", "on"].includes(normalized);
  }

  return Boolean(value);
};

const getCategoryLabel = (value) =>
  STORY_CATEGORY_OPTIONS.find(
    (option) => option.value === String(value || "").trim().toLowerCase(),
  )?.label || String(value || "").trim() || "News";

const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderBlogTemplatePreview = (content, tokenMap = {}) =>
  String(content || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (full, key) => {
    const normalizedKey = String(key || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_");
    const value = toPlainObject(tokenMap)[normalizedKey];
    return value == null || value === "" ? full : String(value);
  });

const hasStructuredArticleMarkup = (value) =>
  /<\s*(?:p|br|h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|a|strong|em|b|i|u)\b/i.test(
    String(value || ""),
  );

const sanitizeArticleMarkup = (value) => {
  const normalized = String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(\/?)(?:div|section|article)\b[^>]*>/gi, (_, closing) =>
      closing ? "</p>" : "<p>",
    )
    .replace(
      /<(script|style|iframe|object|embed|form|input|button|textarea|select|svg|canvas)[^>]*>[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(/<h1\b/gi, "<h2")
    .replace(/<\/h1>/gi, "</h2>")
    .replace(/\son[a-z]+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(?:style|class|id|aria-[\w-]+|data-[\w-]+)\s*=\s*(\"[^\"]*\"|'[^']*')/gi,
      "",
    )
    .replace(/\s(?:style|class|id)\s*=\s*[^\s>]+/gi, "")
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"')
    .replace(/src\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<p>\s*(?:<br\s*\/?>|\s)*<\/p>/gi, "");

  return normalized
    .replace(
      /<(?!\/?(?:p|br|strong|em|b|i|u|a|ul|ol|li|h2|h3|h4|h5|h6|blockquote|table|thead|tbody|tr|th|td)\b)[^>]+>/gi,
      "",
    )
    .trim();
};

const buildEditorSurfaceHtml = (value) => {
  const content = String(value || "").trim();
  if (!content) return "";

  if (hasStructuredArticleMarkup(content)) {
    return sanitizeArticleMarkup(content);
  }

  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
};

const buildArticlePreviewHtml = (value) => {
  const content = String(value || "").trim();
  if (!content) return "";

  if (hasStructuredArticleMarkup(content)) {
    return sanitizeArticleMarkup(content)
      .replace(/<table\b([^>]*)>/gi, '<div class="article-table-wrap"><table$1>')
      .replace(/<\/table>/gi, "</table></div>");
  }

  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
};

const hasMeaningfulArticleContent = (value) =>
  Boolean(
    buildEditorSurfaceHtml(value)
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, "")
      .trim(),
  );

const BlogEditor = () => {
  const [blogMode, setBlogMode] = useState("product");
  const [productType, setProductType] = useState("smartphone");
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tokenMap, setTokenMap] = useState({});
  const [tokenKeys, setTokenKeys] = useState([]);
  const [blogId, setBlogId] = useState(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState(getDefaultStoryCategory("product"));
  const [authorName, setAuthorName] = useState(getDefaultAuthorName());
  const [authorUserId, setAuthorUserId] = useState("");
  const [authorOptions, setAuthorOptions] = useState([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroImageSource, setHeroImageSource] = useState(
    HERO_IMAGE_SOURCE.ASSET,
  );
  const [heroImageAlt, setHeroImageAlt] = useState("");
  const [heroImageCaption, setHeroImageCaption] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [status, setStatus] = useState("draft");
  const [contentTemplate, setContentTemplate] = useState(
    DEFAULT_PRODUCT_TEMPLATE,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [libraryRows, setLibraryRows] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [libraryStatus, setLibraryStatus] = useState("all");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [workspaceView, setWorkspaceView] = useState("listing");
  const [selectedLibraryId, setSelectedLibraryId] = useState(null);
  const [loadingEntryId, setLoadingEntryId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const contentRef = useRef(null);
  const lastEditorHtmlRef = useRef("");
  const savedEditorRangeRef = useRef(null);
  const heroImageInputRef = useRef(null);
  const deferredLibraryQuery = useDeferredValue(libraryQuery);

  const authHeaders = useMemo(() => {
    const token = getAuthToken();
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }, []);

  useEffect(() => {
    let mounted = true;

    const refreshAuthorOptions = async () => {
      try {
        const response = await fetch(buildUrl("/api/rbac/users?includeInactive=false"), {
          headers: authHeaders,
        });
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load authors");
        }

        const users = Array.isArray(data) ? data : [];
        syncRbacState({ users });
        if (!mounted) return;
        setAuthorOptions(
          users.map((user) => ({
            value: String(user.id),
            label:
              user.display_name ||
              user.full_name ||
              user.author_name ||
              user.user_name ||
              user.username ||
              "User",
            secondary: user.role_title || user.role || "viewer",
            user,
          })),
        );
      } catch {
        if (!mounted) return;
        try {
          setAuthorOptions(getAuthorOptions({ includeInactive: false }));
        } catch {
          setAuthorOptions([]);
        }
      }
    };

    refreshAuthorOptions();

    const handleStorage = () => {
      if (!mounted) return;
      try {
        setAuthorOptions(getAuthorOptions({ includeInactive: false }));
      } catch {
        setAuthorOptions([]);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      mounted = false;
      window.removeEventListener("storage", handleStorage);
    };
  }, [authHeaders]);

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
        row.category,
        row.author_name,
        row.product_name,
        row.brand_name,
        row.product_type,
        row.hero_image_alt,
        row.hero_image_caption,
        normalizeBlogTags(row.tags).join(" "),
        row.featured ? "featured" : "",
        row.trending ? "trending" : "",
        row.pinned ? "pinned" : "",
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

  const renderedTemplatePreview = useMemo(
    () => renderBlogTemplatePreview(contentTemplate, tokenMap),
    [contentTemplate, tokenMap],
  );

  const editorHasContent = useMemo(
    () => hasMeaningfulArticleContent(contentTemplate),
    [contentTemplate],
  );

  const articlePreviewHtml = useMemo(
    () => buildArticlePreviewHtml(renderedTemplatePreview),
    [renderedTemplatePreview],
  );

  const hasStructuredPreview = useMemo(
    () => hasStructuredArticleMarkup(renderedTemplatePreview),
    [renderedTemplatePreview],
  );

  const startNewProductStory = (nextType = productType) => {
    setError("");
    setMessage("Choose a product to start a linked story.");
    setWorkspaceView("composer");
    setBlogMode("product");
    setProductType(nextType);
    setBlogId(null);
    setSelectedLibraryId(null);
    setSelectedProductId(null);
    setSelectedProduct(null);
    setTokenMap({});
    setTokenKeys([]);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setCategory(getDefaultStoryCategory("product"));
    setAuthorName(getDefaultAuthorName());
    setAuthorUserId("");
    setMetaTitle("");
    setMetaDescription("");
    setHeroImage("");
    setHeroImageSource(HERO_IMAGE_SOURCE.ASSET);
    setHeroImageAlt("");
    setHeroImageCaption("");
    setTagsInput("");
    setFeatured(false);
    setTrending(false);
    setPinned(false);
    setPublishedAt("");
    setUploadingHeroImage(false);
    setStatus("draft");
    setContentTemplate(DEFAULT_PRODUCT_TEMPLATE);
  };

  const startNewGeneralArticle = () => {
    setError("");
    setMessage("Ready for a new general article.");
    setWorkspaceView("composer");
    setBlogMode("general");
    setBlogId(null);
    setSelectedLibraryId(null);
    setSelectedProductId(null);
    setSelectedProduct(null);
    setTokenMap({});
    setTokenKeys([]);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setCategory(getDefaultStoryCategory("general"));
    setAuthorName(getDefaultAuthorName());
    setAuthorUserId("");
    setMetaTitle("");
    setMetaDescription("");
    setHeroImage("");
    setHeroImageSource(HERO_IMAGE_SOURCE.URL);
    setHeroImageAlt("");
    setHeroImageCaption("");
    setTagsInput("");
    setFeatured(false);
    setTrending(false);
    setPinned(false);
    setPublishedAt("");
    setUploadingHeroImage(false);
    setStatus("draft");
    setContentTemplate(DEFAULT_CUSTOM_TEMPLATE);
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

        if (existing) {
          setBlogId(existing.id || null);
          setSelectedLibraryId(existing.id || null);
          setTitle(existing.title || "");
          setSlug(existing.slug || "");
          setExcerpt(existing.excerpt || "");
          setCategory(existing.category || getDefaultStoryCategory("product"));
          setAuthorName(existing.author_name || "");
          setAuthorUserId(
            existing.author_user_id ? String(existing.author_user_id) : "",
          );
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
          setHeroImageAlt(
            existing.hero_image_alt ||
              (product?.name ? String(product.name).trim() : ""),
          );
          setHeroImageCaption(existing.hero_image_caption || "");
          setTagsInput(tagsToInputValue(existing.tags));
          setFeatured(normalizeBoolean(existing.featured));
          setTrending(normalizeBoolean(existing.trending));
          setPinned(normalizeBoolean(existing.pinned));
          setPublishedAt(toDateTimeLocalValue(existing.published_at));
          setStatus(existing.status === "published" ? "published" : "draft");
          setContentTemplate(
            existing.content_template || DEFAULT_PRODUCT_TEMPLATE,
          );
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
          setCategory(getDefaultStoryCategory("product"));
          setAuthorName(getDefaultAuthorName());
          setAuthorUserId("");
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
          setHeroImageAlt(productName || "");
          setHeroImageCaption("");
          setTagsInput("");
          setFeatured(false);
          setTrending(false);
          setPinned(false);
          setPublishedAt("");
          setStatus("draft");
          setContentTemplate(DEFAULT_PRODUCT_TEMPLATE);
          setMessage("Ready to draft a new product-linked story.");
        }
    } catch (err) {
      setError(err.message || "Failed to load product suggestions");
      setBlogId(null);
      setSelectedLibraryId(null);
      setSelectedProduct(null);
      setTokenMap({});
      setTokenKeys([]);
      setHeroImage("");
      setCategory(getDefaultStoryCategory("product"));
      setAuthorName(getDefaultAuthorName());
      setAuthorUserId("");
      setHeroImageAlt("");
      setHeroImageCaption("");
      setTagsInput("");
      setFeatured(false);
      setTrending(false);
      setPinned(false);
      setPublishedAt("");
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

    setWorkspaceView("composer");
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
      setTitle(article.title || "");
      setSlug(article.slug || "");
      setExcerpt(article.excerpt || "");
      setCategory(article.category || getDefaultStoryCategory("general"));
      setAuthorName(article.author_name || "");
      setAuthorUserId(article.author_user_id ? String(article.author_user_id) : "");
      setMetaTitle(article.meta_title || "");
      setMetaDescription(article.meta_description || "");
      setHeroImage(article.hero_image || "");
      setHeroImageSource(
        normalizeHeroImageSource(article.hero_image_source) ||
          HERO_IMAGE_SOURCE.URL,
      );
      setHeroImageAlt(article.hero_image_alt || "");
      setHeroImageCaption(article.hero_image_caption || "");
      setTagsInput(tagsToInputValue(article.tags));
      setFeatured(normalizeBoolean(article.featured));
      setTrending(normalizeBoolean(article.trending));
      setPinned(normalizeBoolean(article.pinned));
      setPublishedAt(toDateTimeLocalValue(article.published_at));
      setStatus(article.status === "published" ? "published" : "draft");
      setContentTemplate(article.content_template || DEFAULT_CUSTOM_TEMPLATE);
      setMessage("Loaded saved article.");
    } catch (err) {
      setError(err.message || "Failed to load article");
      setBlogMode("general");
      setSelectedLibraryId(null);
      setBlogId(null);
      setSelectedProductId(null);
      setSelectedProduct(null);
      setTokenMap({});
      setTokenKeys([]);
      setHeroImage("");
      setCategory(getDefaultStoryCategory("general"));
      setAuthorName(getDefaultAuthorName());
      setAuthorUserId("");
      setHeroImageAlt("");
      setHeroImageCaption("");
      setTagsInput("");
      setFeatured(false);
      setTrending(false);
      setPinned(false);
      setPublishedAt("");
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
    const editor = contentRef.current;
    if (!editor) return;

    const nextHtml = buildEditorSurfaceHtml(contentTemplate);
    if (lastEditorHtmlRef.current === nextHtml) return;

    editor.innerHTML = nextHtml;
    lastEditorHtmlRef.current = nextHtml;
  }, [contentTemplate]);

  const rememberEditorSelection = () => {
    if (typeof window === "undefined") return;

    const editor = contentRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    savedEditorRangeRef.current = range.cloneRange();
  };

  const restoreEditorSelection = () => {
    if (typeof window === "undefined") return;

    const editor = contentRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return;

    editor.focus();

    if (!savedEditorRangeRef.current) return;

    selection.removeAllRanges();
    selection.addRange(savedEditorRangeRef.current);
  };

  const syncEditorStateFromDom = () => {
    const editor = contentRef.current;
    if (!editor) return "";

    const nextValue = buildEditorSurfaceHtml(editor.innerHTML);
    lastEditorHtmlRef.current = nextValue;
    setContentTemplate(nextValue);
    return nextValue;
  };

  const runEditorCommand = (command, value = null) => {
    if (typeof document === "undefined") return;

    restoreEditorSelection();
    document.execCommand("defaultParagraphSeparator", false, "p");
    document.execCommand(command, false, value);
    syncEditorStateFromDom();
    rememberEditorSelection();
  };

  const insertEditorHtml = (html) => {
    if (typeof document === "undefined") return;

    restoreEditorSelection();
    document.execCommand("defaultParagraphSeparator", false, "p");
    document.execCommand("insertHTML", false, html);
    syncEditorStateFromDom();
    rememberEditorSelection();
  };

  const insertEditorText = (text) => {
    if (typeof document === "undefined") return;

    restoreEditorSelection();
    document.execCommand("defaultParagraphSeparator", false, "p");
    const inserted = document.execCommand("insertText", false, text);
    if (!inserted) {
      document.execCommand("insertHTML", false, escapeHtml(text));
    }
    syncEditorStateFromDom();
    rememberEditorSelection();
  };

  const applyLink = () => {
    if (typeof window === "undefined") return;

    const nextUrl = window.prompt("Enter the link URL");
    if (!nextUrl) return;

    const normalizedUrl = String(nextUrl).trim();
    if (!normalizedUrl) return;

    const selection = window.getSelection ? window.getSelection() : null;
    const selectionText = selection ? String(selection.toString() || "").trim() : "";
    if (selectionText) {
      runEditorCommand("createLink", normalizedUrl);
      return;
    }

    insertEditorHtml(
      `<a href="${escapeHtml(normalizedUrl)}">${escapeHtml(normalizedUrl)}</a>`,
    );
  };

  const insertStarterLayout = () =>
    insertEditorHtml(
      [
        "<h2>What you need to know</h2>",
        "<p>Start with the key update in one direct paragraph.</p>",
        "<h3>Why it matters</h3>",
        "<p>Add context, pricing, availability, or market impact here.</p>",
        "<ul><li>First highlight</li><li>Second highlight</li></ul>",
      ].join(""),
    );

  const insertTableLayout = () =>
    insertEditorHtml(
      [
        "<table>",
        "<thead><tr><th>Spec</th><th>Details</th></tr></thead>",
        "<tbody>",
        "<tr><td>Battery</td><td>{{battery}}</td></tr>",
        "<tr><td>Processor</td><td>{{processor}}</td></tr>",
        "</tbody>",
        "</table>",
      ].join(""),
    );

  const insertToken = (tokenKey) => {
    insertEditorText(`{{${tokenKey}}}`);
  };

  const pastePlainTextIntoEditor = (text) => {
    const html = String(text || "")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
      .join("");

    if (!html) return;
    insertEditorHtml(html);
  };

  const handleToolbarAction = (event, action) => {
    event.preventDefault();
    action();
  };

  const formattingTools = [
    {
      key: "starter",
      label: "Starter layout",
      onClick: insertStarterLayout,
    },
    {
      key: "h2",
      label: "H2",
      onClick: () => runEditorCommand("formatBlock", "<h2>"),
    },
    {
      key: "h3",
      label: "H3",
      onClick: () => runEditorCommand("formatBlock", "<h3>"),
    },
    {
      key: "paragraph",
      label: "Paragraph",
      onClick: () => runEditorCommand("formatBlock", "<p>"),
    },
    {
      key: "bullets",
      label: "Bullets",
      onClick: () => runEditorCommand("insertUnorderedList"),
    },
    {
      key: "numbers",
      label: "Numbers",
      onClick: () => runEditorCommand("insertOrderedList"),
    },
    {
      key: "quote",
      label: "Quote",
      onClick: () => runEditorCommand("formatBlock", "<blockquote>"),
    },
    {
      key: "link",
      label: "Link",
      onClick: applyLink,
    },
    {
      key: "bold",
      label: "B",
      onClick: () => runEditorCommand("bold"),
    },
    {
      key: "italic",
      label: "I",
      onClick: () => runEditorCommand("italic"),
    },
    {
      key: "underline",
      label: "U",
      onClick: () => runEditorCommand("underline"),
    },
    {
      key: "table",
      label: "Table",
      onClick: insertTableLayout,
    },
  ];

  const saveBlog = async (statusOverride = null) => {
    const productIdForSave = blogMode === "product" ? selectedProductId : null;
    const nextStatus = statusOverride || status;
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
    if (!hasMeaningfulArticleContent(contentTemplate)) {
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
          category,
          author_name: authorName,
          author_user_id: authorUserId || null,
          hero_image: heroImage || null,
          hero_image_source: effectiveHeroImageSource,
          hero_image_alt: heroImageAlt,
          hero_image_caption: heroImageCaption,
          tags: parseCommaSeparatedList(tagsInput),
          featured,
          trending,
          pinned,
          status: nextStatus,
          published_at: publishedAt || null,
          content_template: contentTemplate,
          token_map: tokenMap,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save content");
      }

      setMessage(
        nextStatus === "published"
          ? "Content published successfully"
          : "Draft saved successfully",
      );
      if (data?.blog?.id) {
        setBlogId(data.blog.id);
        setSelectedLibraryId(data.blog.id);
      }
      setStatus(nextStatus);
      if (data?.blog?.slug) setSlug(data.blog.slug);
      if (data?.blog?.category) setCategory(data.blog.category);
      if (typeof data?.blog?.author_name !== "undefined") {
        setAuthorName(data.blog.author_name || "");
      }
      if (typeof data?.blog?.author_user_id !== "undefined") {
        setAuthorUserId(
          data.blog.author_user_id ? String(data.blog.author_user_id) : "",
        );
      }
      if (data?.blog?.hero_image) setHeroImage(data.blog.hero_image);
      if (data?.blog?.hero_image_source) {
        setHeroImageSource(normalizeHeroImageSource(data.blog.hero_image_source));
      }
      if (typeof data?.blog?.hero_image_alt !== "undefined") {
        setHeroImageAlt(data.blog.hero_image_alt || "");
      }
      if (typeof data?.blog?.hero_image_caption !== "undefined") {
        setHeroImageCaption(data.blog.hero_image_caption || "");
      }
      if (Array.isArray(data?.blog?.tags)) {
        setTagsInput(tagsToInputValue(data.blog.tags));
      }
      if (typeof data?.blog?.featured !== "undefined") {
        setFeatured(Boolean(data.blog.featured));
      }
      if (typeof data?.blog?.trending !== "undefined") {
        setTrending(Boolean(data.blog.trending));
      }
      if (typeof data?.blog?.pinned !== "undefined") {
        setPinned(Boolean(data.blog.pinned));
      }
      if (typeof data?.blog?.published_at !== "undefined") {
        setPublishedAt(toDateTimeLocalValue(data.blog.published_at));
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

    setWorkspaceView("composer");
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
  const previewHeroImage =
    heroImage ||
    getFirstImageCandidate(
      selectedProduct?.hero_image,
      selectedProduct?.image,
      selectedProduct?.image_url,
      selectedProduct?.cover_image,
      selectedProduct?.thumbnail,
      selectedProduct?.images,
    );
  const previewHeroAlt = heroImageAlt || title || "Story cover preview";
  const currentPermalink = slug
    ? `/news/${slug}`
    : "Slug will be generated when you save";
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
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setWorkspaceView("listing")}
                className={`px-3 py-2 text-sm font-medium transition ${
                  workspaceView === "listing"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Posts Library
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceView("composer")}
                className={`px-3 py-2 text-sm font-medium transition ${
                  workspaceView === "composer"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Composer
              </button>
            </div>
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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <FaLink className="text-xs" />
              New Product Story
            </button>
          </div>
        </div>

        {workspaceView === "listing" ? (
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
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-5">
        {workspaceView === "listing" ? (
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
                  placeholder="Search title, slug, author, tags..."
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

          <div className="mt-3 hidden rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid lg:grid-cols-[88px_minmax(0,1.7fr)_minmax(0,1fr)_150px_150px]">
            <span>Image</span>
            <span>Post</span>
            <span>Reference</span>
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
              filteredLibrary.map((row) => {
                const rowTags = normalizeBlogTags(row.tags);
                const rowCategory =
                  row.category ||
                  (row.product_id
                    ? getDefaultStoryCategory("product")
                    : getDefaultStoryCategory("general"));

                return (
                  <div
                    key={row.id}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      selectedLibraryId === row.id
                        ? "border-blue-500 bg-blue-50/40"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="grid gap-3 lg:grid-cols-[88px_minmax(0,1.7fr)_minmax(0,1fr)_150px_150px] lg:items-center">
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        {row.hero_image ? (
                          <img
                            src={row.hero_image}
                            alt={row.hero_image_alt || row.title || "Story cover"}
                            className="h-20 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-20 items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
                            <FaNewspaper className="text-base opacity-80" />
                          </div>
                        )}
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
                        <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                          {row.title || "Untitled content"}
                        </div>
                        {row.excerpt ? (
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {row.excerpt}
                          </div>
                        ) : null}
                        <div className="mt-2 truncate text-[11px] font-medium text-blue-700">
                          {row.slug || "Slug will be generated on save"}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                            {getCategoryLabel(rowCategory)}
                          </span>
                          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            {row.product_id
                              ? row.product_name || "Standalone editorial"
                              : "Standalone editorial"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          {row.author_name ? `By ${row.author_name}` : "No byline set"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {row.brand_name || "No brand assigned"}
                        </div>
                        {rowTags.length ? (
                          <div className="mt-2 text-[11px] leading-5 text-slate-500">
                            Tags: {rowTags.slice(0, 3).join(", ")}
                          </div>
                        ) : null}
                      </div>

                      <div className="text-xs text-slate-600">
                        <div className="font-semibold text-slate-800">
                          {formatDateLabel(row.updated_at)}
                        </div>
                        <div className="mt-1 text-slate-500">
                          {row.published_at
                            ? `Published ${formatDateLabel(row.published_at)}`
                            : "Not published yet"}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {row.featured ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
                              <FaStar className="text-[10px]" />
                              Featured
                            </span>
                          ) : null}
                          {row.trending ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-800">
                              <FaFire className="text-[10px]" />
                              Trending
                            </span>
                          ) : null}
                          {row.pinned ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-800">
                              <FaThumbtack className="text-[10px]" />
                              Pinned
                            </span>
                          ) : null}
                        </div>
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
                );
              })
            )}
          </div>
        </div>
        ) : null}

        {false ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Publish Panel
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

          <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("story-preview-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => saveBlog("draft")}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => saveBlog("published")}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && status === "published" ? "Publishing..." : "Publish"}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Current Mode
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {currentModeLabel}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Permalink
              </div>
              <div className="mt-1 break-all text-sm font-medium text-blue-700">
                {currentPermalink}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Current Reference
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {currentReference}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {getCategoryLabel(category)} • {authorName || "No byline set"}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workflow Notes
            </div>
            <div className="mt-2 text-sm text-slate-700">{currentModeHelp}</div>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div>1. Pick the content mode and source.</div>
              <div>2. Fill the headline, summary, and article body.</div>
              <div>3. Set image, metadata, then preview and publish.</div>
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
        ) : null}
      </div>

      {workspaceView === "composer" ? (
      <div className="mb-5 rounded-[20px] border border-slate-200 bg-white px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Editorial Workspace
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Editorial Composer
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              A cleaner post editor with the writing canvas on the left and the
              publishing rail on the right.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                {currentModeLabel}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                {status === "published" ? "Published" : "Draft"}
              </span>
              <span className="break-all text-blue-700">{currentPermalink}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setWorkspaceView("listing")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              Back to Posts
            </button>
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
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("story-preview-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => saveBlog("draft")}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => saveBlog("published")}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Publish
            </button>
          </div>
        </div>
      </div>
      ) : null}

      {workspaceView === "composer" ? (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-[20px] border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Story Header
            </div>
            <h3 className="mt-2 text-base font-semibold text-slate-900">
              Write The Core Story First
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Keep the writing flow focused here. Story settings, SEO, and
              featured image controls are handled in the right rail.
            </p>
            <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-700">
              {currentPermalink}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

          <div className="hidden mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <FaTag className="text-xs text-slate-400" />
              Story Metadata
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FaTag className="text-[10px]" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  {STORY_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FaUser className="text-[10px]" />
                  Byline / Author
                </label>
                <div className="space-y-2">
                  <select
                    value={authorUserId}
                    onChange={(event) => {
                      const nextAuthorId = event.target.value;
                      setAuthorUserId(nextAuthorId);
                      const selectedAuthor = authorOptions.find(
                        (option) => String(option.value) === String(nextAuthorId),
                      );
                      setAuthorName(
                        selectedAuthor?.label || getDefaultAuthorName() || "",
                      );
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    <option value="">Custom byline</option>
                    {authorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} · {option.secondary}
                      </option>
                    ))}
                  </select>
                  <input
                    value={authorName}
                    onChange={(event) => {
                      setAuthorName(event.target.value);
                      setAuthorUserId("");
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    placeholder={getDefaultAuthorName() || "Editor name"}
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Choose an active author, or type a custom byline if needed.
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FaTag className="text-[10px]" />
                  Tags / Keywords
                </label>
                <input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  placeholder="news, launch, smartphone, samsung"
                />
                <div className="mt-1 text-[11px] text-slate-500">
                  Separate tags with commas. They are used for searching,
                  filters, and related story grouping.
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Story Flags
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    {
                      key: "featured",
                      label: "Featured",
                      icon: FaStar,
                      active: featured,
                      onClick: () => setFeatured((prev) => !prev),
                      activeClass:
                        "border-amber-300 bg-amber-50 text-amber-800",
                    },
                    {
                      key: "trending",
                      label: "Trending",
                      icon: FaFire,
                      active: trending,
                      onClick: () => setTrending((prev) => !prev),
                      activeClass: "border-rose-300 bg-rose-50 text-rose-800",
                    },
                    {
                      key: "pinned",
                      label: "Pinned",
                      icon: FaThumbtack,
                      active: pinned,
                      onClick: () => setPinned((prev) => !prev),
                      activeClass: "border-sky-300 bg-sky-50 text-sky-800",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={item.onClick}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          item.active
                            ? item.activeClass
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="text-[10px]" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <FaCalendarAlt className="text-xs text-slate-400" />
              Publishing & SEO
            </div>

            <div className="grid gap-3 md:grid-cols-2">
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
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FaCalendarAlt className="text-[10px]" />
                  Publish At
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                />
                <div className="mt-1 text-[11px] text-slate-500">
                  Leave blank to publish immediately. Use a future time to
                  schedule an article.
                </div>
              </div>
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Body Editor
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Write naturally, then use the toolbar to shape the article.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              Visual editor
            </div>
          </div>
          <p className="mb-3 mt-3 text-xs text-slate-600">
            No HTML is needed here. Type like a document editor, then use the
            buttons for headings, bold text, lists, quotes, links, and tables.
          </p>

          <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Writing Tools
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Format the story visually. Clean article HTML is stored
                  automatically in the background.
                </div>
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                {hasStructuredPreview
                  ? "Rich article formatting detected"
                  : "Plain paragraph mode"}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {formattingTools.map((tool) => (
                <button
                  key={tool.key}
                  type="button"
                  onPointerDown={(event) =>
                    handleToolbarAction(event, tool.onClick)
                  }
                  className={`rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 ${
                    ["bold", "italic", "underline"].includes(tool.key)
                      ? "min-w-[2.25rem] text-center"
                      : ""
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-[11px] leading-5 text-slate-500">
              Tip: paste plain text, then use the toolbar to style it. Product
              facts on the right can be inserted into the story at the cursor.
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Writing Surface</span>
              <span>{hasStructuredPreview ? "Formatted article" : "Simple article"}</span>
            </div>
            <div className="relative">
              {!editorHasContent ? (
                <div className="pointer-events-none absolute left-4 top-4 right-4 text-[15px] leading-7 text-slate-400">
                  Start writing the full story here. Add headings, lists,
                  links, and tables using the toolbar above.
                </div>
              ) : null}
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => {
                  if (typeof document === "undefined") return;
                  document.execCommand("defaultParagraphSeparator", false, "p");
                  rememberEditorSelection();
                }}
                onInput={() => {
                  syncEditorStateFromDom();
                  rememberEditorSelection();
                }}
                onBlur={() => {
                  const nextValue = syncEditorStateFromDom();
                  if (contentRef.current) {
                    contentRef.current.innerHTML = nextValue;
                  }
                  lastEditorHtmlRef.current = nextValue;
                }}
                onKeyUp={rememberEditorSelection}
                onMouseUp={rememberEditorSelection}
                onPaste={(event) => {
                  const pastedText = event.clipboardData?.getData("text/plain");
                  if (!pastedText) return;
                  event.preventDefault();
                  pastePlainTextIntoEditor(pastedText);
                }}
                className="mb-0 min-h-[420px] w-full overflow-auto border-0 bg-white px-4 py-4 text-[15px] leading-7 text-slate-800 outline-none [&_a]:font-semibold [&_a]:text-sky-700 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-sky-500 [&_blockquote]:bg-sky-50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-slate-700 [&_h2]:mt-7 [&_h2]:text-[24px] [&_h2]:font-black [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-slate-950 [&_h3]:mt-6 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-slate-900 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:my-4 [&_strong]:font-semibold [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
              />
            </div>
          </div>

          <div className="mb-4 text-[11px] text-slate-500">
            The editor saves clean story markup behind the scenes, and the live
            preview below uses the same article rendering rules as the public
            news page.
          </div>

          <div
            id="story-preview-panel"
            className="mb-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Live Preview
                </h4>
                <p className="mt-1 text-xs text-slate-600">
                  Title, standfirst, and body preview with token replacement.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {hasStructuredPreview ? "Rich layout" : "Simple layout"}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              {previewHeroImage ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <img
                    src={previewHeroImage}
                    alt={previewHeroAlt}
                    className="h-56 w-full object-cover sm:h-72"
                  />
                </div>
              ) : null}

              <div className={previewHeroImage ? "mt-5" : ""}>
              {title ? (
                <h2 className="text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">
                  {title}
                </h2>
              ) : (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Add a headline to preview the article header.
                </div>
              )}

              {excerpt ? (
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">
                  {excerpt}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                <span className="font-semibold text-blue-700">
                  {getCategoryLabel(category)}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{authorName || "No byline set"}</span>
              </div>

              {articlePreviewHtml ? (
                <div
                  className="mt-5 text-[15px] leading-7 text-slate-700 [&_p]:mb-5 [&_p:last-child]:mb-0 [&_h2]:mt-8 [&_h2]:text-[22px] [&_h2]:font-black [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-slate-950 [&_h3]:mt-7 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-slate-900 [&_h4]:mt-6 [&_h4]:text-[16px] [&_h4]:font-bold [&_h4]:text-slate-900 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-sky-500 [&_blockquote]:bg-sky-50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-slate-700 [&_a]:font-semibold [&_a]:text-sky-700 [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-slate-950 [&_div.article-table-wrap]:my-5 [&_div.article-table-wrap]:overflow-x-auto [&_table]:min-w-[520px] [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm [&_thead]:bg-slate-50 [&_th]:border [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-slate-800 [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top"
                  dangerouslySetInnerHTML={{ __html: articlePreviewHtml }}
                />
              ) : (
                <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  Start writing the story body to see the rendered preview.
                </div>
              )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Use the right publish rail or top action buttons to save drafts,
            preview the article, and publish when ready.
          </div>
        </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Publish
                </div>
                <div className="mt-2 text-base font-semibold text-slate-900">
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

            <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("story-preview-panel")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              >
                Preview Article
              </button>
              <button
                type="button"
                onClick={() => saveBlog("draft")}
                disabled={saving}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => saveBlog("published")}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && status === "published" ? "Publishing..." : "Publish"}
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Permalink
              </div>
              <div className="mt-1 break-all text-sm font-medium text-blue-700">
                {currentPermalink}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Workflow Notes
              </div>
              <div className="mt-2 text-sm text-slate-700">{currentModeHelp}</div>
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

          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <FaTag className="text-xs text-slate-400" />
              Story Settings
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FaTag className="text-[10px]" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  {STORY_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FaUser className="text-[10px]" />
                  Byline / Author
                </label>
                <div className="space-y-2">
                  <select
                    value={authorUserId}
                    onChange={(event) => {
                      const nextAuthorId = event.target.value;
                      setAuthorUserId(nextAuthorId);
                      const selectedAuthor = authorOptions.find(
                        (option) => String(option.value) === String(nextAuthorId),
                      );
                      setAuthorName(
                        selectedAuthor?.label || getDefaultAuthorName() || "",
                      );
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    <option value="">Custom byline</option>
                    {authorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} | {option.secondary}
                      </option>
                    ))}
                  </select>
                  <input
                    value={authorName}
                    onChange={(event) => {
                      setAuthorName(event.target.value);
                      setAuthorUserId("");
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    placeholder={getDefaultAuthorName() || "Editor name"}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FaTag className="text-[10px]" />
                  Tags / Keywords
                </label>
                <input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  placeholder="news, launch, smartphone, samsung"
                />
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Story Flags
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    {
                      key: "featured",
                      label: "Featured",
                      icon: FaStar,
                      active: featured,
                      onClick: () => setFeatured((prev) => !prev),
                      activeClass:
                        "border-amber-300 bg-amber-50 text-amber-800",
                    },
                    {
                      key: "trending",
                      label: "Trending",
                      icon: FaFire,
                      active: trending,
                      onClick: () => setTrending((prev) => !prev),
                      activeClass: "border-rose-300 bg-rose-50 text-rose-800",
                    },
                    {
                      key: "pinned",
                      label: "Pinned",
                      icon: FaThumbtack,
                      active: pinned,
                      onClick: () => setPinned((prev) => !prev),
                      activeClass: "border-sky-300 bg-sky-50 text-sky-800",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={item.onClick}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          item.active
                            ? item.activeClass
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="text-[10px]" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <FaCalendarAlt className="text-xs text-slate-400" />
              Publishing & SEO
            </div>

            <div className="space-y-3">
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
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FaCalendarAlt className="text-[10px]" />
                  Publish At
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                />
              </div>
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
                  SEO Description
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(event) => setMetaDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  placeholder="Short description used in search previews"
                />
              </div>
            </div>
          </div>

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
                        ? "bg-blue-600 text-white"
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
                        ? "bg-blue-600 text-white"
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
                    alt={heroImageAlt || title || "Selected hero"}
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
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <FaImage className="text-[10px]" />
                    Hero Image Alt Text
                  </label>
                  <input
                    type="text"
                    value={heroImageAlt}
                    onChange={(event) => setHeroImageAlt(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    placeholder="Describe the image for accessibility and SEO"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <FaImage className="text-[10px]" />
                    Image Caption / Credit
                  </label>
                  <input
                    type="text"
                    value={heroImageCaption}
                    onChange={(event) =>
                      setHeroImageCaption(event.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    placeholder="Image credit shown below the hero image"
                  />
                </div>
              </div>
            </div>
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
                    onPointerDown={(event) =>
                      handleToolbarAction(event, () => insertToken(tokenKey))
                    }
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  >
                    {`{{${tokenKey}}}`}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      ) : null}
    </div>
  );
};

export default BlogEditor;
