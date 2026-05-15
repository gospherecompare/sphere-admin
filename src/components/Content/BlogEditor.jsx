import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
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
  FaCheckCircle,
} from "react-icons/fa";
import { buildUrl, getAuthToken } from "../../api";
import { uploadToCloudinary } from "../../config/cloudinary";
import { getAuthorOptions, syncRbacState } from "../../utils/rbacStore";
import TiptapStoryEditor from "./TiptapStoryEditor";

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
  const text = String(value || "")
    .trim()
    .toLowerCase();
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

const tagsToInputValue = (value) =>
  formatCommaSeparatedList(normalizeBlogTags(value));

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
    (option) =>
      option.value ===
      String(value || "")
        .trim()
        .toLowerCase(),
  )?.label ||
  String(value || "").trim() ||
  "News";

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

const decodeHtmlEntities = (value) => {
  let text = String(value || "");
  if (!text) return "";

  const replacements = [
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&quot;", '"'],
    ["&#39;", "'"],
    ["&nbsp;", " "],
    ["&amp;", "&"],
  ];

  for (let pass = 0; pass < 2; pass += 1) {
    let next = text;
    replacements.forEach(([encoded, decoded]) => {
      next = next.split(encoded).join(decoded);
    });
    if (next === text) break;
    text = next;
  }

  return text;
};

const normalizeArticleContent = (value) =>
  decodeHtmlEntities(String(value || "").replace(/\r\n?/g, "\n")).trim();

const applyInlineBoldMarkers = (value) =>
  String(value || "")
    .split(/(<[^>]+>)/g)
    .map((segment) => {
      if (!segment || segment.startsWith("<")) return segment;

      return segment
        .replace(/\*\*([\s\S]*?)\*\*/g, (full, inner) => {
          const text = String(inner || "").trim();
          return text ? `<strong>${text}</strong>` : full;
        })
        .replace(/__([\s\S]*?)__/g, (full, inner) => {
          const text = String(inner || "").trim();
          return text ? `<strong>${text}</strong>` : full;
        });
    })
    .join("");

const renderBlogTemplatePreview = (content, tokenMap = {}) =>
  normalizeArticleContent(content).replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (full, key) => {
      const normalizedKey = String(key || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_");
      const value = toPlainObject(tokenMap)[normalizedKey];
      return value == null || value === "" ? full : String(value);
    },
  );

const hasStructuredArticleMarkup = (value) =>
  /<\s*(?:p|br|h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|a|strong|em|b|i|u|figure|figcaption|img)\b/i.test(
    normalizeArticleContent(value),
  );

const sanitizeArticleMarkup = (value) => {
  const normalized = normalizeArticleContent(value)
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

  return applyInlineBoldMarkers(normalized)
    .replace(
      /<(?!\/?(?:p|br|strong|em|b|i|u|a|ul|ol|li|h2|h3|h4|h5|h6|blockquote|table|thead|tbody|tr|th|td|figure|figcaption|img)\b)[^>]+>/gi,
      "",
    )
    .trim();
};

const buildInlineImageHtml = (source, { alt = "", caption = "" } = {}) => {
  const normalizedSource = String(source || "").trim();
  if (!normalizedSource) return "";

  const normalizedAlt = String(alt || "").trim();
  const normalizedCaption = String(caption || "").trim();

  return [
    `<img src="${escapeHtml(normalizedSource)}" alt="${escapeHtml(
      normalizedAlt,
    )}" />`,
    normalizedCaption
      ? `<p><em>${escapeHtml(normalizedCaption)}</em></p>`
      : "",
    "<p><br /></p>",
  ].join("");
};

const buildEditorSurfaceHtml = (value) => {
  const content = normalizeArticleContent(value);
  if (!content) return "";

  if (hasStructuredArticleMarkup(content)) {
    return sanitizeArticleMarkup(content);
  }

  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p>${applyInlineBoldMarkers(
          escapeHtml(paragraph).replace(/\n/g, "<br />"),
        )}</p>`,
    )
    .join("");
};

const buildArticlePreviewHtml = (value) => {
  const content = normalizeArticleContent(value);
  if (!content) return "";

  if (hasStructuredArticleMarkup(content)) {
    return sanitizeArticleMarkup(content)
      .replace(
        /<table\b([^>]*)>/gi,
        '<div class="article-table-wrap"><table$1>',
      )
      .replace(/<\/table>/gi, "</table></div>");
  }

  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p>${applyInlineBoldMarkers(
          escapeHtml(paragraph).replace(/\n/g, "<br />"),
        )}</p>`,
    )
    .join("");
};

const clampTableCount = (value, fallback, min = 1, max = 12) => {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const hasMeaningfulArticleContent = (value) =>
  Boolean(
    buildEditorSurfaceHtml(value)
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, "")
      .trim(),
  );

const resolveStoredArticleContent = (record, fallback = "") => {
  const candidateFields = [
    record?.content_template,
    record?.content_rendered,
    record?.content,
    record?.content_html,
    record?.body,
    record?.body_html,
    record?.article_body,
    record?.story_body,
    fallback,
  ];

  const match = candidateFields.find((value) =>
    hasMeaningfulArticleContent(value),
  );

  return normalizeArticleContent(match || fallback);
};

const BlogEditor = () => {
  // Get articleId from route param (for /blog-editor/:id or similar route)
  const { id: routeArticleId } = useParams ? useParams() : { id: undefined };
  // Auto-load article if route param is present and not already loaded
  useEffect(() => {
    if (routeArticleId && String(blogId) !== String(routeArticleId)) {
      loadGeneralArticle(Number(routeArticleId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeArticleId]);
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
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
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
  const [mobileComposerPanels, setMobileComposerPanels] = useState({
    publish: true,
    workflow: false,
    settings: true,
    seo: false,
    source: true,
    facts: false,
  });
  const storyEditorRef = useRef(null);
  const heroImageInputRef = useRef(null);
  const inlineImageInputRef = useRef(null);
  const deferredLibraryQuery = useDeferredValue(libraryQuery);

  const toggleMobileComposerPanel = (panelKey) => {
    setMobileComposerPanels((prev) => ({
      ...prev,
      [panelKey]: !prev[panelKey],
    }));
  };

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
        const response = await fetch(
          buildUrl("/api/rbac/users?includeInactive=false"),
          {
            headers: authHeaders,
          },
        );
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

  const prepareEditorForExternalContent = () => {
    storyEditorRef.current?.clearSavedSelection?.();
  };

  const loadEditorTemplate = (nextContent) => {
    prepareEditorForExternalContent();
    setContentTemplate(nextContent);
  };

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
    loadEditorTemplate(DEFAULT_PRODUCT_TEMPLATE);
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
    loadEditorTemplate(DEFAULT_CUSTOM_TEMPLATE);
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
        loadEditorTemplate(
          resolveStoredArticleContent(existing, DEFAULT_PRODUCT_TEMPLATE),
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
        loadEditorTemplate(DEFAULT_PRODUCT_TEMPLATE);
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

  const insertInlineImage = ({
    source,
    alt = "",
    caption = "",
  }) => {
    const markup = buildInlineImageHtml(source, {
      alt: alt || title || "Article image",
      caption,
    });
    if (!markup) return false;

    return Boolean(storyEditorRef.current?.insertHtml?.(markup));
  };

  const insertInlineImageFromUrl = () => {
    if (typeof window === "undefined") return;

    runEditorPromptTask(() => {
      const requestedUrl = window.prompt("Enter the inline image URL");
      if (requestedUrl === null) return;

      const normalizedUrl = String(requestedUrl || "").trim();
      if (!normalizedUrl) return;

      const fallbackAlt = title || "Article image";
      const requestedAlt = window.prompt(
        "Add alt text for the image",
        fallbackAlt,
      );
      const requestedCaption = window.prompt("Optional caption or credit", "");

      insertInlineImage({
        source: normalizedUrl,
        alt: String(requestedAlt || fallbackAlt).trim() || fallbackAlt,
        caption: String(requestedCaption || "").trim(),
      });
    });
  };

  const handleInlineImageUpload = async (file) => {
    if (!file) return;

    setUploadingInlineImage(true);
    setError("");

    try {
      const data = await uploadToCloudinary(file, "banners", {
        resourceType: "image",
      });

      if (!data?.secure_url) {
        throw new Error("No secure_url returned from upload");
      }

      const fileLabel = String(file.name || "")
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
      const fallbackAlt = title || fileLabel || "Article image";
      const requestedAlt =
        typeof window !== "undefined"
          ? runEditorPromptTask(() =>
              window.prompt("Add alt text for the image", fallbackAlt),
            )
          : fallbackAlt;
      const requestedCaption =
        typeof window !== "undefined"
          ? runEditorPromptTask(() =>
              window.prompt("Optional caption or credit", ""),
            )
          : "";

      insertInlineImage({
        source: data.secure_url,
        alt: String(requestedAlt || fallbackAlt).trim() || fallbackAlt,
        caption: String(requestedCaption || "").trim(),
      });
      setMessage("Inline image inserted into the story.");
    } catch (err) {
      setError(err?.message || "Failed to upload inline image");
    } finally {
      setUploadingInlineImage(false);
    }
  };

  const openInlineImagePicker = () => {
    const input = inlineImageInputRef.current;
    if (!input) return;
    storyEditorRef.current?.saveSelection?.();
    input.click();
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
      setAuthorUserId(
        article.author_user_id ? String(article.author_user_id) : "",
      );
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
      loadEditorTemplate(
        resolveStoredArticleContent(article, DEFAULT_CUSTOM_TEMPLATE),
      );
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

  const insertEditorHtml = (html) =>
    Boolean(storyEditorRef.current?.insertHtml?.(html));

  const insertEditorText = (text) =>
    Boolean(storyEditorRef.current?.insertText?.(text));

  const runEditorPromptTask = (task) => {
    storyEditorRef.current?.saveSelection?.();
    return typeof task === "function" ? task() : undefined;
  };

  const getSavedEditorSelectionText = () =>
    String(storyEditorRef.current?.getSelectedText?.() || "").trim();

  const applyLink = () => {
    if (typeof window === "undefined") return;

    runEditorPromptTask(() => {
      const nextUrl = window.prompt("Enter the link URL");
      if (!nextUrl) return;

      const normalizedUrl = String(nextUrl).trim();
      if (!normalizedUrl) return;

      const selectionText = getSavedEditorSelectionText();
      if (selectionText) {
        storyEditorRef.current?.setLink?.(normalizedUrl);
        return;
      }

      insertEditorHtml(
        `<a href="${escapeHtml(normalizedUrl)}">${escapeHtml(
          normalizedUrl,
        )}</a>`,
      );
    });
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

  const insertGuideStepLayout = () =>
    insertEditorHtml(
      [
        "<h2>How to use this feature</h2>",
        "<p>Open with a clear intro so the reader knows what changed and why it matters.</p>",
        "<h3><strong>Step 1:</strong> Open the right setting</h3>",
        "<p>Explain the first action in direct language and mention the exact screen or menu to open.</p>",
        "<h3><strong>Step 2:</strong> Turn the feature on</h3>",
        "<p>Call out the toggle, tap target, or confirmation message the reader should watch for.</p>",
        "<h3><strong>Step 3:</strong> Confirm the result</h3>",
        "<p>Close with what changes after setup, plus any caveat or tip that saves the reader time.</p>",
      ].join(""),
    );

  const insertTableLayout = () => {
    if (typeof window === "undefined") return;

    runEditorPromptTask(() => {
      const requestedColumns = window.prompt(
        "How many columns should the table have?",
        "2",
      );
      if (requestedColumns === null) return;

      const requestedRows = window.prompt(
        "How many body rows should the table have?",
        "2",
      );
      if (requestedRows === null) return;

      const columnCount = clampTableCount(requestedColumns, 2, 1, 8);
      const rowCount = clampTableCount(requestedRows, 2, 1, 20);

      const headerLabels =
        blogMode === "product" && columnCount === 2
          ? ["Spec", "Details"]
          : Array.from(
              { length: columnCount },
              (_, index) => `Column ${index + 1}`,
            );

      const productPresetRows =
        blogMode === "product" && columnCount === 2
          ? [
              ["Battery", "{{battery}}"],
              ["Processor", "{{processor}}"],
              ["Price", "{{price}}"],
              ["Display", "{{display}}"],
              ["Main Camera", "{{main_camera}}"],
              ["RAM", "{{ram}}"],
              ["Storage", "{{storage}}"],
              ["OS", "{{os}}"],
            ]
          : [];

      const tableRows = Array.from({ length: rowCount }, (_, rowIndex) => {
        const presetRow = productPresetRows[rowIndex] || [];
        const cells = Array.from({ length: columnCount }, (_, columnIndex) => {
          if (presetRow[columnIndex]) return presetRow[columnIndex];
          if (columnIndex === 0) return `Row ${rowIndex + 1}`;
          return "";
        });

        return `<tr>${cells
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join("")}</tr>`;
      });

      insertEditorHtml(
        [
          "<table>",
          `<thead><tr>${headerLabels
            .map((label) => `<th>${escapeHtml(label)}</th>`)
            .join("")}</tr></thead>`,
          "<tbody>",
          ...tableRows,
          "</tbody>",
          "</table>",
        ].join(""),
      );
    });
  };

  const insertToken = (tokenKey) => {
    insertEditorText(`{{${tokenKey}}}`);
  };

  const handleToolbarAction = (event, action) => {
    event.preventDefault();
    storyEditorRef.current?.saveSelection?.();
    action();
  };

  const formattingTools = [
    {
      key: "starter",
      label: "Start news article",
      description: "Adds a ready-made news story structure.",
      onClick: insertStarterLayout,
    },
    {
      key: "guide",
      label: "Start how-to guide",
      description: "Adds step-by-step guide sections.",
      onClick: insertGuideStepLayout,
    },
    {
      key: "h2",
      label: "Big heading",
      description: "Use for a main section title.",
      onClick: () => storyEditorRef.current?.toggleHeading?.(2),
    },
    {
      key: "h3",
      label: "Small heading",
      description: "Use under a main section heading.",
      onClick: () => storyEditorRef.current?.toggleHeading?.(3),
    },
    {
      key: "paragraph",
      label: "Normal text",
      description: "Switch back to regular paragraph text.",
      onClick: () => storyEditorRef.current?.setParagraph?.(),
    },
    {
      key: "bullets",
      label: "Bullet list",
      description: "Show points as simple bullet items.",
      onClick: () => storyEditorRef.current?.toggleBulletList?.(),
    },
    {
      key: "numbers",
      label: "Numbered list",
      description: "Show steps in order with numbers.",
      onClick: () => storyEditorRef.current?.toggleOrderedList?.(),
    },
    {
      key: "quote",
      label: "Highlight quote",
      description: "Pull out an important statement or note.",
      onClick: () => storyEditorRef.current?.toggleBlockquote?.(),
    },
    {
      key: "link",
      label: "Add website link",
      description: "Turn text into a clickable link.",
      onClick: applyLink,
    },
    {
      key: "image-url",
      label: "Use image link",
      description: "Insert a photo from a web URL.",
      onClick: insertInlineImageFromUrl,
    },
    {
      key: "image-upload",
      label: uploadingInlineImage ? "Uploading image..." : "Upload photo",
      description: "Insert a photo from your computer.",
      onClick: openInlineImagePicker,
    },
    {
      key: "bold",
      label: "Bold text",
      description: "Make selected words stand out more.",
      onClick: () => storyEditorRef.current?.toggleBold?.(),
    },
    {
      key: "italic",
      label: "Italic text",
      description: "Add lighter emphasis to selected words.",
      onClick: () => storyEditorRef.current?.toggleItalic?.(),
    },
    {
      key: "underline",
      label: "Underline text",
      description: "Underline selected words or phrases.",
      onClick: () => storyEditorRef.current?.toggleUnderline?.(),
    },
    {
      key: "table",
      label: "Add table",
      description: "Create rows and columns for facts or comparisons.",
      onClick: insertTableLayout,
    },
  ];

  const formattingToolMap = useMemo(
    () => new Map(formattingTools.map((tool) => [tool.key, tool])),
    [formattingTools],
  );

  const toolbarGroups = useMemo(
    () =>
      [
        {
          title: "Start With a Ready Layout",
          hint: "Pick a starting block if you do not want to begin from a blank page.",
          keys: ["starter", "guide", "table"],
        },
        {
          title: "Change the Text Style",
          hint: "Use these when you want a heading, normal text, or a highlighted quote.",
          keys: ["h2", "h3", "paragraph", "quote"],
        },
        {
          title: "Add Lists or Links",
          hint: "Use these for points, steps, or clickable website links.",
          keys: ["bullets", "numbers", "link"],
        },
        {
          title: "Add an Image",
          hint: "The image is inserted exactly where your cursor is placed in the article.",
          keys: ["image-upload", "image-url"],
        },
        {
          title: "Highlight Important Words",
          hint: "Use these when you want selected words to stand out more.",
          keys: ["bold", "italic", "underline"],
        },
      ].map((group) => ({
        ...group,
        tools: group.keys
          .map((key) => formattingToolMap.get(key))
          .filter(Boolean),
      })),
    [formattingToolMap],
  );

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
        setHeroImageSource(
          normalizeHeroImageSource(data.blog.hero_image_source),
        );
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
      blogMode === "product" && heroImageSource === HERO_IMAGE_SOURCE.ASSET
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
  const libraryOverviewCards = [
    {
      label: "Library Items",
      value: libraryStats.total,
      hint: "Saved stories and articles",
      cardClassName: "border-slate-200 bg-white",
      labelClassName: "text-slate-500",
      valueClassName: "text-2xl text-slate-900",
    },
    {
      label: "Drafts",
      value: libraryStats.draft,
      hint: "Needs review or publish",
      cardClassName: "border-amber-200 bg-amber-50",
      labelClassName: "text-amber-700",
      valueClassName: "text-2xl text-amber-900",
    },
    {
      label: "Published",
      value: libraryStats.published,
      hint: "Live in the newsroom",
      cardClassName: "border-emerald-200 bg-emerald-50",
      labelClassName: "text-emerald-700",
      valueClassName: "text-2xl text-emerald-900",
    },
  ];
  const editorOverviewCards = [
    {
      label: "Workspace",
      value: blogMode === "product" ? "Product Linked" : "General Article",
      hint:
        workspaceView === "composer"
          ? "Editing surface active"
          : "Library mode active",
      cardClassName: "border-slate-200 bg-white",
      labelClassName: "text-slate-500",
      valueClassName: "text-lg leading-6 text-slate-900",
    },
    {
      label: "Publish State",
      value: status === "published" ? "Published" : "Draft",
      hint: publishedAt
        ? `Scheduled ${formatDateLabel(publishedAt)}`
        : "Ready to save or publish",
      cardClassName:
        status === "published"
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50",
      labelClassName:
        status === "published" ? "text-emerald-700" : "text-amber-700",
      valueClassName:
        status === "published"
          ? "text-lg leading-6 text-emerald-900"
          : "text-lg leading-6 text-amber-900",
    },
    {
      label: blogMode === "product" ? "Source Device" : "Permalink",
      value:
        blogMode === "product"
          ? selectedProduct?.name || "No product selected"
          : slug || "Auto generated on save",
      hint:
        blogMode === "product"
          ? selectedProduct?.brand_name || currentModeHelp
          : currentPermalink,
      cardClassName: "border-blue-200 bg-blue-50",
      labelClassName: "text-blue-700",
      valueClassName: "text-base leading-6 text-blue-900",
    },
    {
      label: "Workflow Progress",
      value: `${
        [
          blogMode === "general" || Boolean(selectedProductId),
          Boolean(title.trim()),
          Boolean(excerpt.trim()),
          editorHasContent,
          Boolean(previewHeroImage),
          Boolean(metaTitle.trim() && metaDescription.trim()),
        ].filter(Boolean).length
      } / 6`,
      hint: "Source, headline, summary, body, image, and SEO checks",
      cardClassName: "border-violet-200 bg-violet-50",
      labelClassName: "text-violet-700",
      valueClassName: "text-lg leading-6 text-violet-900",
    },
  ];
  const activeOverviewCards =
    workspaceView === "listing" ? libraryOverviewCards : editorOverviewCards;

  const workflowChecklist = [
    {
      label: "Choose source",
      done: blogMode === "general" || Boolean(selectedProductId),
      detail:
        blogMode === "product"
          ? selectedProduct?.name || "Pick the product that powers this story."
          : "General article mode is active.",
    },
    {
      label: "Add headline and summary",
      done: Boolean(title.trim()) && Boolean(excerpt.trim()),
      detail:
        title.trim() && excerpt.trim()
          ? "Headline and standfirst are ready."
          : "These power the article header, cards, and previews.",
    },
    {
      label: "Write the body",
      done: editorHasContent,
      detail: editorHasContent
        ? "Formatted story content is ready in the writing surface."
        : "Use the body editor to write the core article content.",
    },
    {
      label: "Set hero image",
      done: Boolean(previewHeroImage),
      detail: previewHeroImage
        ? "A hero image is available for the preview and live post."
        : "Recommended for stronger cards and article headers.",
    },
    {
      label: "Review SEO and publish",
      done: Boolean(metaTitle.trim() && metaDescription.trim()),
      detail:
        metaTitle.trim() && metaDescription.trim()
          ? "SEO basics are filled in."
          : "Add SEO title and description before final publish.",
    },
  ];

  const workflowCompletedCount = workflowChecklist.filter(
    (item) => item.done,
  ).length;

  const workspaceGuideCards =
    workspaceView === "listing"
      ? [
          {
            title: "Track status",
            text: "Filter drafts and published posts from one registry view.",
          },
          {
            title: "Reopen any entry",
            text: "Open a row to continue editing without leaving the workspace.",
          },
          {
            title: "Manage faster",
            text: "Search by title, slug, author, brand, or tags.",
          },
        ]
      : [
          {
            title: "1. Select source",
            text:
              blogMode === "product"
                ? "Choose the product first so facts and images load automatically."
                : "Use general mode for custom newsroom stories and explainers.",
          },
          {
            title: "2. Write the story",
            text:
              "Use the grouped writing tools like a document editor. No HTML is needed.",
          },
          {
            title: "3. Review and publish",
            text:
              "Check the preview, add SEO details, then save as draft or publish.",
          },
        ];

  return (
    <div className="relative isolate overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.10),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_48%,_#ffffff_100%)] mx-auto w-full max-w-[1720px] flex flex-col gap-6 px-3 py-3 sm:px-6 sm:py-4">
      <div className="rounded-[32px] border border-blue-200/30 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.22),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_42%,_#6d28d9_100%)] text-white shadow-[0_32px_90px_rgba(37,99,235,0.28)] overflow-hidden p-3 sm:p-4 md:p-6">
        <div className="grid gap-4 sm:gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-col gap-4 sm:gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white shadow-lg shadow-slate-950/15 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <FaNewspaper className="text-lg" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Editorial ERP</p>
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                      {workspaceView === "listing"
                        ? "Library view"
                        : "Composer view"}
                    </span>
                    {workspaceView === "composer" ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-200/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                        {workflowCompletedCount} / {workflowChecklist.length} steps ready
                      </span>
                    ) : null}
                  </div>
                  <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.03em] text-white sm:mt-2">
                    News and Articles Studio
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-100/90 sm:mt-3">
                    Manage product linked stories and general editorial content from
                    one ERP workspace with a registry view, editor controls, live
                    preview, and publish actions in one place.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full flex-col items-stretch sm:w-auto sm:flex-row sm:items-center">
                <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:inline-flex">
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                >
                  New Article
                </button>
                <button
                  type="button"
                  onClick={() => startNewProductStory()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
                >
                  <FaLink className="text-xs" />
                  New Product Story
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {workspaceGuideCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white shadow-sm shadow-slate-950/10 backdrop-blur"
                >
                  <div className="text-sm font-semibold tracking-tight">
                    {card.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-100/85">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/15 p-4 text-white shadow-lg shadow-slate-950/15 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100/70">
                  {workspaceView === "listing"
                    ? "Registry Summary"
                    : "Workflow Summary"}
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {workspaceView === "listing"
                    ? `${filteredLibrary.length} visible records`
                    : `${workflowCompletedCount} of ${workflowChecklist.length} publishing checks complete`}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-100/70">
                  Active Desk
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {workspaceView === "listing" ? "Content registry" : currentModeLabel}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(workspaceView === "listing"
                ? [
                    {
                      label: "Drafts waiting",
                      detail: `${libraryStats.draft} items still need review or publish.`,
                    },
                    {
                      label: "Published records",
                      detail: `${libraryStats.published} items are already live in the newsroom.`,
                    },
                    {
                      label: "Search behaviour",
                      detail: deferredLibraryQuery
                        ? `Filtered by "${deferredLibraryQuery}".`
                        : "Search title, slug, author, tags, product, or brand.",
                    },
                  ]
                : workflowChecklist
              ).map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-3"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      "done" in item && item.done
                        ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
                        : "border-white/15 bg-white/10 text-white/90"
                    }`}
                  >
                    {"done" in item && item.done ? (
                      <FaCheckCircle className="text-xs" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-100/75">
                      {item.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {activeOverviewCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm ${card.cardClassName}`}
          >
            <div
              className={`text-xs font-semibold uppercase tracking-wide ${card.labelClassName}`}
            >
              {card.label}
            </div>
            <div className={`mt-2 font-semibold ${card.valueClassName}`}>
              {card.value}
            </div>
            <div className="mt-1 text-xs text-slate-500">{card.hint}</div>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-[20px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-5">
        {workspaceView === "listing" ? (
          <div className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm overflow-hidden">
            <div className="border-b border-slate-200/70 bg-gradient-to-r from-blue-50/90 via-white to-purple-50/80 px-4 py-4 md:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700/80">Registry</p>
                  <h2 className="mt-1 text-base font-semibold text-slate-900">
                    Content Library
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    This is the editorial register for your team. Search by title,
                    slug, author, tags, or linked product, then reopen any row in
                    the composer workspace.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Status Filter
                    </div>
                    <select
                      value={libraryStatus}
                      onChange={(event) => setLibraryStatus(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="all">All statuses</option>
                      <option value="draft">Draft only</option>
                      <option value="published">Published only</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:col-span-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Search Register
                    </div>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <div className="relative min-w-0 flex-1">
                        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                        <input
                          value={libraryQuery}
                          onChange={(event) => setLibraryQuery(event.target.value)}
                          placeholder="Search title, slug, author, brand, or tags"
                          className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-800"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => loadLibrary(libraryStatus)}
                        disabled={libraryLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-white disabled:opacity-60"
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
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-4">
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
                        className={`w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
                          selectedLibraryId === row.id
                            ? "border-blue-500 bg-blue-50/40 shadow-blue-100"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="grid gap-3 lg:grid-cols-[88px_minmax(0,1.7fr)_minmax(0,1fr)_150px_150px] lg:items-center">
                          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            {row.hero_image ? (
                              <img
                                src={row.hero_image}
                                alt={
                                  row.hero_image_alt ||
                                  row.title ||
                                  "Story cover"
                                }
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
                              <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                Record #{row.id}
                              </span>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                                  STATUS_BADGES[row.status] ||
                                  STATUS_BADGES.draft
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
                              {row.author_name
                                ? `By ${row.author_name}`
                                : "No byline set"}
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
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-800">
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
                                loadingEntryId === row.id ||
                                deletingId === row.id
                              }
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {loadingEntryId === row.id
                                ? "Loading..."
                                : "Open in Composer"}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteBlog(row)}
                              disabled={
                                deletingId === row.id ||
                                loadingEntryId === row.id
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-100 disabled:opacity-60"
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
              <div className="mt-2 text-sm text-slate-700">
                {currentModeHelp}
              </div>
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
        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm overflow-hidden p-4 md:p-6">
          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700/80">Editorial Workspace</p>
              <h2 className="font-semibold tracking-[-0.03em] text-slate-950 mt-2 text-2xl sm:text-3xl">
                Editorial Composer
              </h2>
              <p className="text-[15px] leading-6 text-slate-600 mt-2 max-w-2xl text-sm">
                Use this workspace like an ERP desk: source on the right,
                writing in the center, preview below, and publish actions always
                within reach.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-2 font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 px-2.5 py-1">
                  {currentModeLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-2 font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 px-2.5 py-1">
                  {status === "published" ? "Published" : "Draft"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-2 font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 px-2.5 py-1">
                  {workflowCompletedCount} / {workflowChecklist.length} workflow checks
                </span>
                <span className="break-all text-blue-700">
                  {currentPermalink}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  {
                    title: "Step 1",
                    text:
                      blogMode === "product"
                        ? "Choose the source product in the control rail."
                        : "General article mode is ready for custom writing.",
                  },
                  {
                    title: "Step 2",
                    text:
                      "Fill headline, summary, and body. The editor stores clean markup automatically.",
                  },
                  {
                    title: "Step 3",
                    text:
                      "Review preview, SEO, and publishing controls before going live.",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {card.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {card.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Command Center
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                Fast actions for editors
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Switch modes, save progress, or jump to preview without leaving the writer flow.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWorkspaceView("listing")}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
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
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="product">Product-Linked Story</option>
                  <option value="general">General Article</option>
                </select>
                {blogMode === "product" ? (
                  <select
                    value={productType}
                    onChange={(event) => startNewProductStory(event.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="smartphone">Smartphones</option>
                    <option value="laptop">Laptops</option>
                    <option value="tv">TVs</option>
                  </select>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("story-preview-panel")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => saveBlog("draft")}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => saveBlog("published")}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {workspaceView === "composer" ? (
        <div className="grid gap-5 pb-28 xl:grid-cols-[minmax(0,1fr)_360px] xl:pb-0">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm overflow-hidden">
              <div className="border-b border-slate-200/70 bg-gradient-to-r from-blue-50/90 via-white to-purple-50/80 px-5 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700/80">Writing Desk</p>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">
                      Write the core story first
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-600">
                      Keep the writing flow focused here. Story settings, SEO, and
                      hero image controls stay in the control rail so the editor
                      remains clean.
                    </p>
                    <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-700">
                      {currentPermalink}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 lg:w-[28rem]">
                    {[
                      {
                        label: "No HTML",
                        value: "Write like a document",
                      },
                      {
                        label: "Inline Images",
                        value: "Insert at the cursor",
                      },
                      {
                        label: "Preview",
                        value: "Updates from saved markup",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {item.label}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white">
                      1
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Story Basics
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Set the headline, slug, and short summary that readers see first.
                      </div>
                    </div>
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
                              (option) =>
                                String(option.value) === String(nextAuthorId),
                            );
                            setAuthorName(
                              selectedAuthor?.label ||
                                getDefaultAuthorName() ||
                                "",
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
                        Choose an active author, or type a custom byline if
                        needed.
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
                            activeClass:
                              "border-rose-300 bg-rose-50 text-rose-800",
                          },
                          {
                            key: "pinned",
                            label: "Pinned",
                            icon: FaThumbtack,
                            active: pinned,
                            onClick: () => setPinned((prev) => !prev),
                            activeClass:
                              "border-blue-300 bg-blue-50 text-blue-800",
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
                        onChange={(event) =>
                          setMetaDescription(event.target.value)
                        }
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                        placeholder="Short description used in search previews"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                        2
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Body Editor
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          Write naturally, then use the guided writing tools to shape the article.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                      Visual editor
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-slate-600">
                    No HTML is needed here. Type like a document editor, then use
                    the buttons for headings, bold text, lists, quotes, links, and
                    tables. You can also type `**important words**` to make them
                    bold in preview and on the live story page.
                  </p>
                </div>

                <div className="mb-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Writing Tools
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Choose what you want to add to the article. Each button explains itself in plain language.
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
                      {hasStructuredPreview
                        ? "Rich article formatting detected"
                        : "Plain paragraph mode"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {toolbarGroups.map((group) => (
                      <div
                        key={group.title}
                        className="rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {group.title}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {group.hint}
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {group.tools.map((tool) => (
                            <button
                              key={tool.key}
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(event, tool.onClick)
                              }
                              className="flex min-h-[4rem] flex-col items-start justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:border-slate-300 hover:bg-white"
                            >
                              <span className="text-xs font-semibold text-slate-800">
                                {tool.label}
                              </span>
                              <span className="mt-1 text-[11px] leading-4 text-slate-500">
                                {tool.description}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-3 text-[11px] leading-6 text-slate-500">
                    Tip: write the article in normal text first, then use these buttons only when you want to add a heading, list, link, image, or emphasis. Product facts on the right can still be inserted at the cursor.
                  </div>
                  <input
                    ref={inlineImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0] || null;
                      await handleInlineImageUpload(file);
                      event.target.value = "";
                    }}
                  />
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span>Writing Surface</span>
                    <span>
                      {hasStructuredPreview
                        ? "Formatted article"
                        : "Simple article"}
                    </span>
                  </div>
                  <div className="relative">
                    {!editorHasContent ? (
                      <div className="pointer-events-none absolute left-4 top-4 right-4 text-[15px] leading-7 text-slate-400">
                        Start writing the full story here. Add headings, lists,
                        links, inline images, and tables using the toolbar
                        above.
                      </div>
                    ) : null}
                    <TiptapStoryEditor
                      ref={storyEditorRef}
                      value={contentTemplate}
                      onChange={setContentTemplate}
                      normalizeContent={buildEditorSurfaceHtml}
                    />
                  </div>
                </div>

                <div className="mb-4 text-[11px] text-slate-500">
                  The editor saves clean story markup behind the scenes, and the
                  live preview below uses the same article rendering rules as
                  the public news page.
                </div>

                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-sm font-semibold text-white">
                      3
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Live Preview
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        Review the article exactly as the newsroom renderer understands it.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  id="story-preview-panel"
                  className="mb-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        Live Preview
                      </h4>
                      <p className="mt-1 text-xs text-slate-600">
                        Title, standfirst, and body preview with token
                        replacement.
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
                          className="mt-5 text-[15px] leading-7 text-slate-700 [&_p]:mb-5 [&_p:last-child]:mb-0 [&_p:first-of-type]:text-[16px] [&_p:first-of-type]:leading-8 [&_p:first-of-type]:text-slate-800 sm:[&_p:first-of-type]:text-[17px] sm:[&_p:first-of-type]:leading-8 [&_h2]:mt-8 [&_h2]:text-[22px] [&_h2]:font-black [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-slate-950 [&_h3]:mt-7 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-slate-900 [&_h4]:mt-6 [&_h4]:text-[16px] [&_h4]:font-bold [&_h4]:text-slate-900 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:bg-blue-50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-slate-700 [&_a]:font-semibold [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-bold [&_strong]:text-slate-950 [&_figure]:my-7 [&_figure]:overflow-hidden [&_figure]:rounded-2xl [&_figure]:border [&_figure]:border-slate-200 [&_figure]:bg-slate-50 [&_figure_figcaption]:border-t [&_figure_figcaption]:border-slate-200 [&_figure_figcaption]:px-4 [&_figure_figcaption]:py-3 [&_figure_figcaption]:text-xs [&_figure_figcaption]:uppercase [&_figure_figcaption]:tracking-[0.14em] [&_figure_figcaption]:text-slate-500 [&_figure_img]:w-full [&_figure_img]:bg-slate-100 [&_figure_img]:object-cover [&_img]:my-6 [&_img]:w-full [&_img]:rounded-2xl [&_div.article-table-wrap]:my-5 [&_div.article-table-wrap]:overflow-x-auto [&_table]:min-w-[520px] [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm [&_thead]:bg-slate-50 [&_th]:border [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-slate-800 [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top"
                          dangerouslySetInnerHTML={{
                            __html: articlePreviewHtml,
                          }}
                        />
                      ) : (
                        <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                          Start writing the story body to see the rendered
                          preview.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Use the right publish rail or top action buttons to save
                  drafts, preview the article, and publish when ready.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 xl:sticky xl:top-4 xl:space-y-4 xl:self-start">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm xl:hidden">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Mobile Editor Mode
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                Open only the panel you need
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Use the panels below for settings, SEO, images, and product facts. The story editor stays cleaner on smaller screens.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {status === "published" ? "Published" : "Draft"}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Mode
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {blogMode === "product" ? "Product" : "General"}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Progress
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {workflowCompletedCount}/{workflowChecklist.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm rounded-3xl p-4 shadow-sm md:p-5">
              <button
                type="button"
                onClick={() => toggleMobileComposerPanel("publish")}
                className="flex w-full items-start justify-between gap-3 text-left xl:hidden"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Publish & Preview
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Save, preview, or publish this article
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {mobileComposerPanels.publish ? "Hide" : "Open"}
                </span>
              </button>

              <div className="hidden items-start justify-between gap-3 xl:flex">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Publish Center
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

              <div
                className={`${
                  mobileComposerPanels.publish ? "mt-4 block" : "hidden"
                } xl:mt-0 xl:block`}
              >
                {message ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  >
                    Preview Article
                  </button>
                  <button
                    type="button"
                    onClick={() => saveBlog("draft")}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => saveBlog("published")}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving && status === "published"
                      ? "Publishing..."
                      : "Publish"}
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Permalink
                  </div>
                  <div className="mt-1 break-all text-sm font-medium text-blue-700">
                    {currentPermalink}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Workflow Notes
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    {currentModeHelp}
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
                          product_type:
                            blogMode === "product" ? productType : null,
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

            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm rounded-3xl p-4 shadow-sm md:p-5">
              <button
                type="button"
                onClick={() => toggleMobileComposerPanel("workflow")}
                className="flex w-full items-center justify-between gap-3 text-left xl:hidden"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Workflow Checklist
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Track what is ready before publishing
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {mobileComposerPanels.workflow ? "Hide" : "Open"}
                </span>
              </button>

              <div className="mb-3 hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:flex">
                <FaCheckCircle className="text-xs text-emerald-500" />
                Workflow Checklist
              </div>

              <div
                className={`space-y-3 ${
                  mobileComposerPanels.workflow ? "block" : "hidden"
                } xl:block`}
              >
                {workflowChecklist.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-2xl border px-3 py-3 ${
                      item.done
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          item.done
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-500"
                        }`}
                      >
                        {item.done ? <FaCheckCircle className="text-xs" /> : "•"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {item.label}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm rounded-3xl p-4 shadow-sm md:p-5">
              <button
                type="button"
                onClick={() => toggleMobileComposerPanel("settings")}
                className="flex w-full items-center justify-between gap-3 text-left xl:hidden"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Story Details
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Category, author, tags, and flags
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {mobileComposerPanels.settings ? "Hide" : "Open"}
                </span>
              </button>

              <div className="mb-3 hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:flex">
                <FaTag className="text-xs text-slate-400" />
                Story Settings
              </div>
              <p className="mb-4 hidden text-sm text-slate-600 xl:block">
                Manage editorial labels, author details, and visibility flags for this article.
              </p>

              <div
                className={`space-y-3 ${
                  mobileComposerPanels.settings ? "mt-4 block" : "hidden"
                } xl:mt-0 xl:block`}
              >
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
                          (option) =>
                            String(option.value) === String(nextAuthorId),
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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
                        activeClass: "border-blue-300 bg-blue-50 text-blue-800",
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

            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm rounded-3xl p-4 shadow-sm md:p-5">
              <button
                type="button"
                onClick={() => toggleMobileComposerPanel("seo")}
                className="flex w-full items-center justify-between gap-3 text-left xl:hidden"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    SEO & Schedule
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Publish timing and search details
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {mobileComposerPanels.seo ? "Hide" : "Open"}
                </span>
              </button>

              <div className="mb-3 hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:flex">
                <FaCalendarAlt className="text-xs text-slate-400" />
                Publishing & SEO
              </div>
              <p className="mb-4 hidden text-sm text-slate-600 xl:block">
                Control when the article goes live and what search engines will read first.
              </p>

              <div
                className={`space-y-3 ${
                  mobileComposerPanels.seo ? "mt-4 block" : "hidden"
                } xl:mt-0 xl:block`}
              >
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={() => toggleMobileComposerPanel("source")}
                className="flex w-full items-center justify-between gap-3 text-left xl:hidden"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Source & Images
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Product source, hero image, and image details
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {mobileComposerPanels.source ? "Hide" : "Open"}
                </span>
              </button>

              <h2 className="hidden text-sm font-semibold text-gray-900 xl:block">
                Source & Assets
              </h2>
              <p className="mt-1 hidden text-xs text-slate-600 xl:block">
                Pick the story source, review the content reference, and control
                the hero image from here.
              </p>

              <div
                className={`${
                  mobileComposerPanels.source ? "mt-4 block" : "hidden"
                } xl:mt-0 xl:block`}
              >
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
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

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
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
                <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-800">
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
                  <div className="mt-3 inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600">
                    <button
                      type="button"
                      onClick={() =>
                        setHeroImageSource(HERO_IMAGE_SOURCE.ASSET)
                      }
                      className={`px-3 py-2 ${
                        heroImageSource === HERO_IMAGE_SOURCE.ASSET
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:bg-slate-50"
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
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Custom URL / upload
                    </button>
                  </div>
                ) : null}

                {heroImage ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
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
                            (
                            {heroImageSource === HERO_IMAGE_SOURCE.ASSET
                              ? "Product asset"
                              : "Custom URL"}
                            )
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
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-500">
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
                            className={`overflow-hidden rounded-xl border text-left transition ${
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
                                <span>
                                  {selected ? "Selected" : "Use image"}
                                </span>
                                <span>#{idx + 1}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                      No product images are attached yet. Add images to the
                      product first, then select one here. You can still switch
                      to a custom URL below.
                    </div>
                  )
                ) : (
                  <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                        placeholder="https://example.com/article-image.jpg"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => heroImageInputRef.current?.click()}
                        disabled={uploadingHeroImage}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                      placeholder="Image credit shown below the hero image"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm rounded-3xl p-3 shadow-sm">
              <button
                type="button"
                onClick={() => toggleMobileComposerPanel("facts")}
                className="flex w-full items-center justify-between gap-3 px-1 py-1 text-left xl:hidden"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Product Facts
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Insert stored facts into the story
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {mobileComposerPanels.facts ? "Hide" : "Open"}
                </span>
              </button>

              <h2 className="mb-2 hidden text-sm font-semibold text-gray-900 xl:block">
                Product Facts
              </h2>
              <p className="mb-3 hidden text-xs text-slate-600 xl:block">
                Insert product-specific facts into the story body when you need
                them. These are most useful for product-linked stories.
              </p>
              <div
                className={`${
                  mobileComposerPanels.facts ? "mt-4 block" : "hidden"
                } xl:mt-0 xl:block`}
              >
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                {blogMode !== "product" ? (
                  <span className="text-xs text-slate-500">
                    Switch to a product-linked story to use dynamic product
                    facts.
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
        </div>
      ) : null}
      {workspaceView === "composer" ? (
        <div className="fixed inset-x-3 bottom-3 z-30 xl:hidden">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Quick Actions
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Save or publish without leaving the editor
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

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("story-preview-panel")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => saveBlog("draft")}
                disabled={saving}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => saveBlog("published")}
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BlogEditor;




