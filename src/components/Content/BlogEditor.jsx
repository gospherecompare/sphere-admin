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
  FaBold,
  FaCode,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaDownload,
  FaEllipsisV,
  FaFilter,
  FaItalic,
  FaLink,
  FaListOl,
  FaListUl,
  FaNewspaper,
  FaPen,
  FaPlus,
  FaQuoteRight,
  FaRedo,
  FaRegEye,
  FaSearch,
  FaSyncAlt,
  FaTable,
  FaStrikethrough,
  FaUndo,
  FaUnderline,
  FaUpload,
  FaTrashAlt,
  FaTag,
  FaImage,
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

const HERO_IMAGE_SOURCE = {
  ASSET: "asset",
  NONE: "none",
  URL: "url",
};

const normalizeHeroImageSource = (value) => {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (!text) return "";
  if (text === "asset" || text === "product" || text === "product_asset")
    return HERO_IMAGE_SOURCE.ASSET;
  if (text === "none" || text === "removed" || text === "empty")
    return HERO_IMAGE_SOURCE.NONE;
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

const getProductThumbnail = (product) =>
  getFirstImageCandidate(
    product?.image,
    product?.hero_image,
    product?.image_url,
    product?.cover_image,
    product?.thumbnail,
    product?.images,
  );

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

const formatDateParts = (value) => {
  if (!value) return { dateLabel: "--", timeLabel: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { dateLabel: "--", timeLabel: "" };

  return {
    dateLabel: new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(date),
    timeLabel: new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
};

const isFutureDateValue = (value) => {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

const getListingStatusKey = (row) => {
  const baseStatus = String(row?.status || "")
    .trim()
    .toLowerCase();

  if (baseStatus === "published") {
    return isFutureDateValue(row?.published_at) ? "scheduled" : "published";
  }

  return "draft";
};

const getListingStatusLabel = (row) => {
  const key = getListingStatusKey(row);
  if (key === "scheduled") return "Scheduled";
  if (key === "published") return "Published";
  return "Draft";
};

const LISTING_STATUS_BADGES = {
  all: "border-slate-200 bg-slate-50 text-slate-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  trash: "border-rose-200 bg-rose-50 text-rose-700",
};

const getAuthorInitials = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const getCategoryBadgeClassName = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["guides", "guide"].includes(normalized)) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  if (["launches", "launch"].includes(normalized)) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (["mobiles", "smartphones"].includes(normalized)) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (["gadgets"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
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

const countWords = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const formatWordCountLabel = (value) => {
  const count = countWords(value);
  return `${count} ${count === 1 ? "word" : "words"}`;
};

const getDefaultStoryCategory = (mode = "general") =>
  mode === "product" ? "launches" : "news";

const normalizeSelectedProductIds = (...sources) => {
  const seen = new Set();
  const ids = [];

  const pushValue = (value) => {
    const normalized = Number(
      value && typeof value === "object"
        ? value.product_id ?? value.productId ?? value.id
        : value,
    );
    if (!Number.isInteger(normalized) || normalized <= 0 || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    ids.push(normalized);
  };

  sources.forEach((source) => {
    if (Array.isArray(source)) {
      source.forEach(pushValue);
      return;
    }
    pushValue(source);
  });

  return ids;
};

const orderSelectedProducts = (products = [], productIds = []) => {
  const byId = new Map(
    (Array.isArray(products) ? products : [])
      .map((product) => [Number(product?.product_id), product])
      .filter(([productId]) => Number.isInteger(productId) && productId > 0),
  );
  const orderedIds = normalizeSelectedProductIds(productIds);
  return orderedIds
    .map((productId) => byId.get(productId))
    .filter(Boolean);
};

const buildSelectedProductNames = (products = []) =>
  (Array.isArray(products) ? products : [])
    .map((product) => String(product?.name || "").trim())
    .filter(Boolean);

const buildDefaultProductStoryTitle = (products = []) => {
  const names = buildSelectedProductNames(products);
  if (names.length === 0) return "";
  if (names.length === 1) {
    return `${names[0]} - Specs, Price and Highlights`;
  }
  if (names.length === 2) {
    return `${names[0]} vs ${names[1]}: Specs, price and key differences`;
  }
  if (names.length === 3) {
    return `${names[0]}, ${names[1]} and ${names[2]}: Launches, pricing and highlights`;
  }
  return `${names[0]}, ${names[1]} and ${names.length - 2} more: Launch roundup`;
};

const buildProductSelectionAlt = (products = []) => {
  const names = buildSelectedProductNames(products);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and more`;
};

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
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(?:style|class|id|aria-[\w-]+|data-[\w-]+)\s*=\s*("[^"]*"|'[^']*')/gi,
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
  const { id: routeArticleId } = useParams();
  // Auto-load article if route param is present and not already loaded
  useEffect(() => {
    if (routeArticleId && String(blogId) !== String(routeArticleId)) {
      loadBlogArticle(Number(routeArticleId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeArticleId]);
  const [blogMode, setBlogMode] = useState("product");
  const [productType, setProductType] = useState("smartphone");
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateProductId, setCandidateProductId] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
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
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogUrl, setLinkDialogUrl] = useState("");
  const [linkDialogText, setLinkDialogText] = useState("");
  const [linkDialogError, setLinkDialogError] = useState("");
  const [libraryRows, setLibraryRows] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [libraryTab, setLibraryTab] = useState("all");
  const [libraryStatus, setLibraryStatus] = useState("all");
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState("all");
  const [libraryAuthorFilter, setLibraryAuthorFilter] = useState("all");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryPage, setLibraryPage] = useState(1);
  const [libraryPageSize, setLibraryPageSize] = useState(10);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState([]);
  const [workspaceView, setWorkspaceView] = useState("listing");
  const [selectedLibraryId, setSelectedLibraryId] = useState(null);
  const [loadingEntryId, setLoadingEntryId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [newPostMenuOpen, setNewPostMenuOpen] = useState(false);
  const [libraryActionMenuId, setLibraryActionMenuId] = useState(null);
  const [composerSidebarTab, setComposerSidebarTab] = useState("post");
  const [composerPreviewOpen, setComposerPreviewOpen] = useState(false);
  const [editorUiState, setEditorUiState] = useState({
    canRedo: false,
    canUndo: false,
    hasSelection: false,
    isBlockquote: false,
    isBold: false,
    isBulletList: false,
    isCodeBlock: false,
    isEmpty: true,
    isFocused: false,
    isH2: false,
    isH3: false,
    isItalic: false,
    isLink: false,
    isOrderedList: false,
    isParagraph: true,
    isStrike: false,
    isUnderline: false,
  });
  const storyEditorRef = useRef(null);
  const heroImageInputRef = useRef(null);
  const inlineImageInputRef = useRef(null);
  const linkUrlInputRef = useRef(null);
  const slugInputRef = useRef(null);
  const tagsInputRef = useRef(null);
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
    return libraryRows.reduce(
      (acc, row) => {
        acc.total += 1;
        acc[getListingStatusKey(row)] += 1;
        return acc;
      },
      {
        total: 0,
        published: 0,
        draft: 0,
        scheduled: 0,
        trash: 0,
      },
    );
  }, [libraryRows]);

  const libraryCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          libraryRows
            .map((row) => String(row.category || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [libraryRows],
  );

  const libraryAuthorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          libraryRows
            .map((row) => String(row.author_name || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [libraryRows],
  );

  const filteredLibrary = useMemo(() => {
    const query = String(deferredLibraryQuery || "")
      .trim()
      .toLowerCase();

    return libraryRows.filter((row) => {
      const rowStatus = getListingStatusKey(row);
      const rowCategory = String(row.category || "")
        .trim()
        .toLowerCase();
      const rowAuthor = String(row.author_name || "")
        .trim()
        .toLowerCase();
      const haystack = [
        row.title,
        row.slug,
        row.category,
        row.author_name,
        row.product_names,
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

      if (libraryTab !== "all" && rowStatus !== libraryTab) return false;
      if (libraryStatus !== "all" && rowStatus !== libraryStatus) return false;
      if (
        libraryCategoryFilter !== "all" &&
        rowCategory !==
          String(libraryCategoryFilter || "")
            .trim()
            .toLowerCase()
      ) {
        return false;
      }
      if (
        libraryAuthorFilter !== "all" &&
        rowAuthor !==
          String(libraryAuthorFilter || "")
            .trim()
            .toLowerCase()
      ) {
        return false;
      }

      return !query || haystack.includes(query);
    });
  }, [
    deferredLibraryQuery,
    libraryAuthorFilter,
    libraryCategoryFilter,
    libraryRows,
    libraryStatus,
    libraryTab,
  ]);

  const totalLibraryPages = useMemo(
    () => Math.max(1, Math.ceil(filteredLibrary.length / libraryPageSize)),
    [filteredLibrary.length, libraryPageSize],
  );

  const paginatedLibrary = useMemo(() => {
    const start = (libraryPage - 1) * libraryPageSize;
    return filteredLibrary.slice(start, start + libraryPageSize);
  }, [filteredLibrary, libraryPage, libraryPageSize]);

  const selectedCandidateProduct = useMemo(() => {
    const normalizedId = Number(candidateProductId);
    if (!Number.isInteger(normalizedId) || normalizedId <= 0) return null;

    return (
      candidates.find(
        (row) => Number(row?.product_id) === normalizedId,
      ) || null
    );
  }, [candidateProductId, candidates]);

  const selectedCandidateProductImage = useMemo(
    () => getProductThumbnail(selectedCandidateProduct),
    [selectedCandidateProduct],
  );

  const selectedPrimaryProductImage = useMemo(
    () => getProductThumbnail(selectedProduct),
    [selectedProduct],
  );

  const selectedProductImageChoices = useMemo(
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

  const defaultSelectedProductImage = selectedProductImageChoices[0] || "";

  const currentHeroImageSource = useMemo(
    () => normalizeHeroImageSource(heroImageSource),
    [heroImageSource],
  );

  const defaultHeroAltText = useMemo(() => {
    const productAlt =
      blogMode === "product" ? buildProductSelectionAlt(selectedProducts) : "";
    return title.trim() || productAlt || "Article thumbnail";
  }, [blogMode, selectedProducts, title]);

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

  const prepareEditorForExternalContent = () => {
    storyEditorRef.current?.clearSavedSelection?.();
  };

  const loadEditorTemplate = (nextContent) => {
    prepareEditorForExternalContent();
    setContentTemplate(nextContent);
  };

  const applyProductSelection = (products = [], preferredProductIds = []) => {
    const orderedProducts = orderSelectedProducts(products, preferredProductIds);
    const orderedIds = normalizeSelectedProductIds(
      preferredProductIds.length ? preferredProductIds : orderedProducts,
    );
    const primaryProduct = orderedProducts[0] || null;
    const primaryProductId = orderedIds[0] || null;

    setSelectedProducts(orderedProducts);
    setSelectedProductIds(orderedIds);
    setSelectedProduct(primaryProduct);
    setSelectedProductId(primaryProductId);
  };

  const resetProductContext = () => {
    applyProductSelection([], []);
    setTokenMap({});
    setTokenKeys([]);
  };

  const hydrateProductStoryDraft = (products = [], existing = null) => {
    const orderedProducts = orderSelectedProducts(
      products,
      normalizeSelectedProductIds(products),
    );
    const primaryProduct = orderedProducts[0] || null;
    const primaryImages = collectImageCandidates(
      primaryProduct?.hero_image,
      primaryProduct?.image,
      primaryProduct?.image_url,
      primaryProduct?.cover_image,
      primaryProduct?.thumbnail,
      primaryProduct?.images,
    );

    if (existing) {
      const existingHeroSource = normalizeHeroImageSource(
        existing.hero_image_source,
      );
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
        existingHeroSource === HERO_IMAGE_SOURCE.NONE
          ? ""
          : existing.hero_image ||
            getFirstImageCandidate(
              primaryProduct?.hero_image,
              primaryProduct?.image,
              primaryProduct?.image_url,
              primaryProduct?.cover_image,
              primaryProduct?.thumbnail,
              primaryProduct?.images,
            );
      setHeroImage(heroChoice);
      setHeroImageSource(
        existingHeroSource ||
          inferHeroImageSource(heroChoice, primaryImages),
      );
      setHeroImageAlt(
        existing.hero_image_alt || buildProductSelectionAlt(orderedProducts),
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
      return;
    }

    setBlogId(null);
    setSelectedLibraryId(null);
    setTitle(buildDefaultProductStoryTitle(orderedProducts));
    setSlug("");
    setExcerpt("");
    setCategory(getDefaultStoryCategory("product"));
    setAuthorName(getDefaultAuthorName());
    setAuthorUserId("");
    setMetaTitle("");
    setMetaDescription("");
    const heroChoice = getFirstImageCandidate(
      primaryProduct?.hero_image,
      primaryProduct?.image,
      primaryProduct?.image_url,
      primaryProduct?.cover_image,
      primaryProduct?.thumbnail,
      primaryProduct?.images,
    );
    setHeroImage(heroChoice);
    setHeroImageSource(inferHeroImageSource(heroChoice, primaryImages));
    setHeroImageAlt(buildProductSelectionAlt(orderedProducts));
    setHeroImageCaption("");
    setTagsInput("");
    setFeatured(false);
    setTrending(false);
    setPinned(false);
    setPublishedAt("");
    setStatus("draft");
    loadEditorTemplate(DEFAULT_PRODUCT_TEMPLATE);
    setMessage("Ready to draft a new product-linked story.");
  };

  const startNewProductStory = (nextType = productType) => {
    setError("");
    setMessage("Choose one or more products to start a linked story.");
    setWorkspaceView("composer");
    setComposerSidebarTab("post");
    setComposerPreviewOpen(false);
    setBlogMode("product");
    setProductType(nextType);
    setBlogId(null);
    setSelectedLibraryId(null);
    setCandidateProductId(null);
    setSelectedProductIds([]);
    setSelectedProducts([]);
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
    setStatus("draft");
    loadEditorTemplate(DEFAULT_PRODUCT_TEMPLATE);
  };

  const startNewGeneralArticle = () => {
    setError("");
    setMessage("Ready for a new general article.");
    setWorkspaceView("composer");
    setComposerSidebarTab("post");
    setComposerPreviewOpen(false);
    setBlogMode("general");
    setBlogId(null);
    setSelectedLibraryId(null);
    setCandidateProductId(null);
    setSelectedProductIds([]);
    setSelectedProducts([]);
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
    setStatus("draft");
    loadEditorTemplate(DEFAULT_CUSTOM_TEMPLATE);
  };

  const loadLibrary = async () => {
    setLibraryLoading(true);
    setLibraryError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", "100");

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
        setCandidateProductId(null);
        return;
      }

      const preferredId =
        Number(preferredProductId || candidateProductId || selectedProductId) ||
        null;
      const hasPreferred = preferredId
        ? rows.some((row) => row.product_id === preferredId)
        : false;
      setCandidateProductId(hasPreferred ? preferredId : rows[0].product_id);
    } catch (err) {
      setError(err.message || "Failed to load story candidates");
      setCandidates([]);
      setCandidateProductId(null);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const loadProductContext = async (
    productIds,
    { resetDraft = false, hydrateExisting = false } = {},
  ) => {
    const normalizedIds = normalizeSelectedProductIds(productIds);
    if (normalizedIds.length === 0) {
      resetProductContext();
      return;
    }

    setError("");

    try {
      const response = await fetch(buildUrl("/api/admin/blogs/context"), {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          product_ids: normalizedIds,
          primary_product_id: normalizedIds[0],
          match_existing: hydrateExisting,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load story suggestions");
      }

      const orderedIds = normalizeSelectedProductIds(
        data?.product_ids?.length ? data.product_ids : normalizedIds,
      );
      const products = orderSelectedProducts(data?.products || [], orderedIds);
      applyProductSelection(products, orderedIds);
      setTokenMap(data?.token_map || {});
      setTokenKeys(Array.isArray(data?.token_keys) ? data.token_keys : []);

      if (resetDraft) {
        hydrateProductStoryDraft(
          products,
          hydrateExisting ? data?.existing_blog || null : null,
        );
        return;
      }

      const primaryProduct = products[0] || null;
      const primaryImages = collectImageCandidates(
        primaryProduct?.hero_image,
        primaryProduct?.image,
        primaryProduct?.image_url,
        primaryProduct?.cover_image,
        primaryProduct?.thumbnail,
        primaryProduct?.images,
      );
      const fallbackHero = getFirstImageCandidate(
        primaryProduct?.hero_image,
        primaryProduct?.image,
        primaryProduct?.image_url,
        primaryProduct?.cover_image,
        primaryProduct?.thumbnail,
        primaryProduct?.images,
      );
      const currentHeroSource = normalizeHeroImageSource(heroImageSource);

      if (!title.trim()) {
        setTitle(buildDefaultProductStoryTitle(products));
      }
      if (!heroImage || currentHeroSource === HERO_IMAGE_SOURCE.ASSET) {
        setHeroImage(fallbackHero);
        setHeroImageSource(inferHeroImageSource(fallbackHero, primaryImages));
      }
      if (!heroImageAlt || currentHeroSource === HERO_IMAGE_SOURCE.ASSET) {
        setHeroImageAlt(buildProductSelectionAlt(products));
      }

      setMessage(
        products.length > 1
          ? "Product selection updated for this story."
          : "Product context loaded for this story.",
      );
    } catch (err) {
      setError(err.message || "Failed to load product suggestions");
    }
  };

  const handleAddCandidateProduct = () => {
    const nextId = Number(candidateProductId);
    if (!Number.isInteger(nextId) || nextId <= 0) return;
    if (selectedProductIds.includes(nextId)) {
      setMessage("That product is already linked to this story.");
      return;
    }

    const nextIds = [...selectedProductIds, nextId];
    const shouldResetDraft = selectedProductIds.length === 0 && !blogId;
    loadProductContext(nextIds, {
      resetDraft: shouldResetDraft,
      hydrateExisting: false,
    });
  };

  const handleRemoveSelectedProduct = (productIdToRemove) => {
    const nextIds = selectedProductIds.filter(
      (productId) => productId !== productIdToRemove,
    );

    if (!nextIds.length) {
      resetProductContext();
      setHeroImage("");
      setHeroImageAlt("");
      setMessage("All linked products were removed from this story.");
      return;
    }

    loadProductContext(nextIds, { resetDraft: false, hydrateExisting: false });
  };

  const handleSetPrimaryProduct = (productIdToPromote) => {
    const nextIds = [
      productIdToPromote,
      ...selectedProductIds.filter((productId) => productId !== productIdToPromote),
    ];
    loadProductContext(nextIds, { resetDraft: false, hydrateExisting: false });
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

  const openHeroImagePicker = () => {
    const input = heroImageInputRef.current;
    if (!input) return;
    input.click();
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
      if (!heroImageAlt.trim()) {
        setHeroImageAlt(defaultHeroAltText);
      }
      setMessage("Thumbnail image uploaded.");
    } catch (err) {
      setError(err?.message || "Failed to upload thumbnail image");
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleUsePrimaryProductImage = () => {
    if (!defaultSelectedProductImage) {
      setError("Primary product image is not available.");
      return;
    }

    setHeroImage(defaultSelectedProductImage);
    setHeroImageSource(
      inferHeroImageSource(
        defaultSelectedProductImage,
        selectedProductImageChoices,
      ),
    );
    if (!heroImageAlt.trim()) {
      setHeroImageAlt(defaultHeroAltText);
    }
    setMessage("Primary product image applied as the thumbnail.");
  };

  const handleRemoveHeroImage = () => {
    setHeroImage("");
    setHeroImageSource(HERO_IMAGE_SOURCE.NONE);
    setMessage("Thumbnail removed from this story.");
  };

  const loadBlogArticle = async (articleId) => {
    if (!articleId) return;

    setWorkspaceView("composer");
    setComposerSidebarTab("post");
    setComposerPreviewOpen(false);
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

      const productIds = normalizeSelectedProductIds(
        article.product_ids,
        article.products,
        article.product_id,
      );
      const nextProducts = orderSelectedProducts(
        article.products || [],
        productIds,
      );
      const nextTokenMap = toPlainObject(
        article.token_map || article.token_snapshot,
      );
      const isProductStory = productIds.length > 0;

      setBlogMode(isProductStory ? "product" : "general");
      setProductType(
        article.product_type || nextProducts[0]?.product_type || "smartphone",
      );
      setSelectedLibraryId(article.id || null);
      setBlogId(article.id || null);
      setCandidateProductId(null);
      applyProductSelection(nextProducts, productIds);
      setTokenMap(nextTokenMap);
      setTokenKeys(
        Array.isArray(article.token_keys)
          ? article.token_keys
          : Object.keys(nextTokenMap).sort(),
      );
      setTitle(article.title || "");
      setSlug(article.slug || "");
      setExcerpt(article.excerpt || "");
      setCategory(
        article.category ||
          getDefaultStoryCategory(isProductStory ? "product" : "general"),
      );
      setAuthorName(article.author_name || "");
      setAuthorUserId(
        article.author_user_id ? String(article.author_user_id) : "",
      );
      setMetaTitle(article.meta_title || "");
      setMetaDescription(article.meta_description || "");
      setHeroImage(article.hero_image || "");
      setHeroImageSource(
        normalizeHeroImageSource(article.hero_image_source) ||
          (isProductStory ? HERO_IMAGE_SOURCE.ASSET : HERO_IMAGE_SOURCE.URL),
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
        resolveStoredArticleContent(
          article,
          isProductStory ? DEFAULT_PRODUCT_TEMPLATE : DEFAULT_CUSTOM_TEMPLATE,
        ),
      );
      setMessage(
        isProductStory ? "Loaded saved product-linked story." : "Loaded saved article.",
      );
    } catch (err) {
      setError(err.message || "Failed to load article");
      setBlogMode("general");
      setCandidateProductId(null);
      setSelectedProductIds([]);
      setSelectedProducts([]);
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
  }, []);

  useEffect(() => {
    setLibraryPage(1);
  }, [
    libraryAuthorFilter,
    libraryCategoryFilter,
    libraryPageSize,
    libraryQuery,
    libraryStatus,
    libraryTab,
  ]);

  useEffect(() => {
    setLibraryPage((prev) => Math.min(prev, totalLibraryPages));
  }, [totalLibraryPages]);

  useEffect(() => {
    if (blogMode !== "product") return;
    loadCandidates(productType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogMode, productType]);

  useEffect(() => {
    if (!linkDialogOpen) return undefined;
    if (typeof window === "undefined") return undefined;

    const frameId = window.requestAnimationFrame(() => {
      linkUrlInputRef.current?.focus();
      linkUrlInputRef.current?.select?.();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [linkDialogOpen]);

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

  const closeLinkDialog = () => {
    setLinkDialogOpen(false);
    setLinkDialogUrl("");
    setLinkDialogText("");
    setLinkDialogError("");
  };

  const applyLink = () => {
    const selectionText = getSavedEditorSelectionText();
    const currentHref = String(
      storyEditorRef.current?.getCurrentLinkHref?.() || "",
    ).trim();

    setLinkDialogUrl(currentHref);
    setLinkDialogText(selectionText || "");
    setLinkDialogError("");
    setLinkDialogOpen(true);
  };

  const submitLinkDialog = () => {
    const normalizedUrl = String(linkDialogUrl || "").trim();
    if (!normalizedUrl) {
      setLinkDialogError("Link URL is required.");
      return;
    }

    const selectionText = getSavedEditorSelectionText();
    const normalizedText = String(linkDialogText || "").trim();
    const currentHref = String(
      storyEditorRef.current?.getCurrentLinkHref?.() || "",
    ).trim();
    const isEditingExistingLink = editorUiState.isLink || Boolean(currentHref);

    if (selectionText && (!normalizedText || normalizedText === selectionText)) {
      storyEditorRef.current?.setLink?.(normalizedUrl);
      setMessage("Link updated in content.");
      closeLinkDialog();
      return;
    }

    if (!selectionText && isEditingExistingLink && !normalizedText) {
      storyEditorRef.current?.setLink?.(normalizedUrl);
      setMessage("Link updated in content.");
      closeLinkDialog();
      return;
    }

    const linkLabel = normalizedText || selectionText || normalizedUrl;
    insertEditorHtml(
      `<a href="${escapeHtml(normalizedUrl)}">${escapeHtml(linkLabel)}</a>`,
    );
    setMessage("Link added to content.");
    closeLinkDialog();
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

  const insertEmbedPlaceholder = () => {
    storyEditorRef.current?.insertHtml?.(
      [
        "<blockquote>",
        "<p><strong>Embed block</strong></p>",
        "<p>Paste a YouTube, X, benchmark chart, or source URL here.</p>",
        "</blockquote>",
      ].join(""),
    );
  };

  const insertToken = (tokenKey) => {
    insertEditorText(`{{${tokenKey}}}`);
  };

  const handleToolbarAction = (event, action, disabled = false) => {
    event.preventDefault();
    if (disabled) return;
    storyEditorRef.current?.saveSelection?.();
    action();
  };

  const editorTemplateActions = [
    {
      key: "starter",
      label: "News layout",
      description: "Insert a launch/news article structure.",
      onClick: insertStarterLayout,
    },
    {
      key: "guide",
      label: "Guide layout",
      description: "Insert a step-by-step explainer structure.",
      onClick: insertGuideStepLayout,
    },
  ];

  const editorSelectionLabel = editorUiState.hasSelection
    ? "Text selected"
    : editorUiState.isFocused
      ? "Cursor active"
      : "Click editor to start";

  const getComposerIconButtonClassName = (active, disabled = false) =>
    `inline-flex h-9 w-9 items-center justify-center border text-sm transition ${
      disabled
        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
        : active
          ? "border-[#7C3AED]/20 bg-[#F3EEFF] text-[#5B34E6]"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    }`;
  const composerFieldClassName =
    "h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-0";
  const composerTextareaClassName =
    "w-full border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-0";
  const composerButtonClassName =
    "inline-flex items-center justify-center border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
  const composerDangerButtonClassName =
    "inline-flex items-center justify-center border border-red-200 bg-red-50 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100";
  const listingFieldClassName =
    "h-11 w-full border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-0 md:px-4";
  const listingButtonClassName =
    "inline-flex h-11 items-center justify-center gap-2 border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 md:px-4";
  const listingIconButtonClassName =
    "inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900";

  const applyEditorBlockMode = (nextMode) => {
    storyEditorRef.current?.saveSelection?.();

    if (nextMode === "h2") {
      storyEditorRef.current?.toggleHeading?.(2);
      return;
    }
    if (nextMode === "h3") {
      storyEditorRef.current?.toggleHeading?.(3);
      return;
    }
    if (nextMode === "quote") {
      storyEditorRef.current?.toggleBlockquote?.();
      return;
    }
    if (nextMode === "bullets") {
      storyEditorRef.current?.toggleBulletList?.();
      return;
    }
    if (nextMode === "numbers") {
      storyEditorRef.current?.toggleOrderedList?.();
      return;
    }
    if (nextMode === "code") {
      storyEditorRef.current?.toggleCodeBlock?.();
      return;
    }

    storyEditorRef.current?.setParagraph?.();
  };

  const saveBlog = async (statusOverride = null) => {
    const productIdsForSave =
      blogMode === "product" ? normalizeSelectedProductIds(selectedProductIds) : [];
    const productIdForSave = productIdsForSave[0] || null;
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
        : normalizeHeroImageSource(heroImageSource) || HERO_IMAGE_SOURCE.URL;

    if (blogMode === "product" && productIdsForSave.length === 0) {
      setError("Select at least one product first");
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
          product_ids: productIdsForSave,
          primary_product_id: productIdForSave || null,
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
      if (Array.isArray(data?.blog?.product_ids)) {
        applyProductSelection(
          selectedProducts,
          data.blog.product_ids,
        );
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
      if (
        data?.blog &&
        Object.prototype.hasOwnProperty.call(data.blog, "hero_image")
      ) {
        setHeroImage(data.blog.hero_image || "");
      }
      if (
        data?.blog &&
        Object.prototype.hasOwnProperty.call(data.blog, "hero_image_source")
      ) {
        setHeroImageSource(
          normalizeHeroImageSource(data.blog.hero_image_source) ||
            HERO_IMAGE_SOURCE.URL,
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
      if (data?.blog?.token_map) {
        setTokenMap(data.blog.token_map);
      }
      if (Array.isArray(data?.blog?.token_keys)) {
        setTokenKeys(data.blog.token_keys);
      }
      await loadLibrary();
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
        const nextProductIds = normalizeSelectedProductIds(
          row?.product_ids,
          row?.products,
          row?.product_id,
        );
        setBlogMode("product");
        setProductType(row.product_type || "smartphone");
        setSelectedLibraryId(null);
        setBlogId(null);
        await loadProductContext(nextProductIds, {
          resetDraft: true,
          hydrateExisting: false,
        });
        setMessage("Deleted saved story. You can continue with a fresh draft.");
      } else if (isCurrentEntry) {
        startNewGeneralArticle();
        setMessage("Deleted saved article. Ready for a new draft.");
      } else {
        setMessage("Content deleted successfully.");
      }

      await loadLibrary();
    } catch (err) {
      setError(err.message || "Failed to delete content");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLibrarySelect = (row) => {
    if (!row?.id) return;

    setWorkspaceView("composer");
    setComposerSidebarTab("post");
    setComposerPreviewOpen(false);
    setError("");
    setMessage("Loading selected story...");
    void loadBlogArticle(Number(row.id));
  };

  const clearLibraryFilters = () => {
    setLibraryTab("all");
    setLibraryStatus("all");
    setLibraryCategoryFilter("all");
    setLibraryAuthorFilter("all");
    setLibraryQuery("");
    setSelectedLibraryIds([]);
  };

  const toggleLibrarySelection = (rowId) => {
    setSelectedLibraryIds((prev) =>
      prev.includes(rowId)
        ? prev.filter((value) => value !== rowId)
        : [...prev, rowId],
    );
  };

  const toggleLibrarySelectionForPage = () => {
    const pageIds = paginatedLibrary
      .map((row) => Number(row.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    setSelectedLibraryIds((prev) => {
      const hasAllPageIds =
        pageIds.length > 0 && pageIds.every((id) => prev.includes(id));

      if (hasAllPageIds) {
        return prev.filter((id) => !pageIds.includes(id));
      }

      return Array.from(new Set([...prev, ...pageIds]));
    });
  };

  const exportLibraryCsv = () => {
    if (typeof window === "undefined" || filteredLibrary.length === 0) return;

    const rows = filteredLibrary.map((row) => ({
      id: row.id ?? "",
      title: row.title ?? "",
      slug: row.slug ?? "",
      author: row.author_name ?? "",
      category: row.category ?? "",
      status: getListingStatusLabel(row),
      published_at: row.published_at ?? "",
      updated_at: row.updated_at ?? "",
      product_name: row.product_names ?? row.product_name ?? "",
      brand_name: row.brand_name ?? "",
      tags: normalizeBlogTags(row.tags).join(", "),
    }));

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) =>
            `"${String(row[header] ?? "").replace(/"/g, '""')}"`,
          )
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "news-posts-library.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const copyBlogPermalink = async (row) => {
    if (typeof window === "undefined" || !row?.slug) return;

    const permalink = `${window.location.origin}/news/${row.slug}`;
    try {
      await navigator.clipboard.writeText(permalink);
      setMessage("Post link copied to clipboard.");
      setError("");
    } catch {
      setError("Failed to copy the post link.");
    }
  };

  const paginationItems = useMemo(() => {
    if (totalLibraryPages <= 7) {
      return Array.from({ length: totalLibraryPages }, (_, index) => index + 1);
    }

    if (libraryPage <= 3) {
      return [1, 2, 3, 4, "...", totalLibraryPages];
    }

    if (libraryPage >= totalLibraryPages - 2) {
      return [
        1,
        "...",
        totalLibraryPages - 3,
        totalLibraryPages - 2,
        totalLibraryPages - 1,
        totalLibraryPages,
      ];
    }

    return [
      1,
      "...",
      libraryPage - 1,
      libraryPage,
      libraryPage + 1,
      "...",
      totalLibraryPages,
    ];
  }, [libraryPage, totalLibraryPages]);

  const selectedPageIds = useMemo(
    () =>
      paginatedLibrary
        .map((row) => Number(row.id))
        .filter((id) => Number.isInteger(id) && id > 0),
    [paginatedLibrary],
  );

  const areAllPageRowsSelected =
    selectedPageIds.length > 0 &&
    selectedPageIds.every((id) => selectedLibraryIds.includes(id));

  const currentPageRangeStart =
    filteredLibrary.length === 0 ? 0 : (libraryPage - 1) * libraryPageSize + 1;
  const currentPageRangeEnd = Math.min(
    libraryPage * libraryPageSize,
    filteredLibrary.length,
  );

  const libraryStatusTabs = useMemo(
    () => [
      {
        key: "all",
        label: "All Posts",
        count: libraryStats.total,
        pillClassName: "bg-violet-100 text-violet-700",
      },
      {
        key: "published",
        label: "Published",
        count: libraryStats.published,
        pillClassName: "bg-emerald-100 text-emerald-700",
      },
      {
        key: "draft",
        label: "Drafts",
        count: libraryStats.draft,
        pillClassName: "bg-amber-100 text-amber-700",
      },
      {
        key: "scheduled",
        label: "Scheduled",
        count: libraryStats.scheduled,
        pillClassName: "bg-blue-100 text-blue-700",
      },
      {
        key: "trash",
        label: "Trash",
        count: libraryStats.trash,
        pillClassName: "bg-rose-100 text-rose-700",
      },
    ],
    [libraryStats],
  );

  const activeTagList = useMemo(() => normalizeBlogTags(tagsInput), [tagsInput]);
  const activeComposerRow = useMemo(() => {
    const activeId = Number(blogId || selectedLibraryId);
    if (!Number.isInteger(activeId) || activeId <= 0) return null;

    return (
      libraryRows.find((row) => Number(row?.id) === activeId) || null
    );
  }, [blogId, libraryRows, selectedLibraryId]);
  const composerEntryLabel = blogId ? "Edit Blog Post" : "Add New Post";
  const composerCrumbLabel = blogId ? "Edit Post" : "Add New Post";
  const composerStatusKey = getListingStatusKey({
    status,
    published_at: publishedAt,
  });
  const composerStatusLabel = getListingStatusLabel({
    status,
    published_at: publishedAt,
  });
  const composerUpdatedSource =
    activeComposerRow?.updated_at ||
    activeComposerRow?.published_at ||
    publishedAt ||
    "";
  const composerUpdatedLabel = composerUpdatedSource
    ? formatDateLabel(composerUpdatedSource)
    : "Not updated yet";
  const editorPermalinkDisplay =
    typeof window === "undefined"
      ? slug
        ? `/blog/${slug}`
        : "/blog/your-post-slug"
      : `${window.location.origin}/blog/${slug || "your-post-slug"}`;
  const editorBlockModeValue = editorUiState.isH2
    ? "h2"
    : editorUiState.isH3
      ? "h3"
      : editorUiState.isCodeBlock
        ? "code"
      : editorUiState.isBlockquote
        ? "quote"
        : editorUiState.isBulletList
          ? "bullets"
          : editorUiState.isOrderedList
            ? "numbers"
            : "paragraph";
  const titleWordCountLabel = formatWordCountLabel(title);
  const excerptWordCountLabel = formatWordCountLabel(excerpt);
  const heroImageAltWordCountLabel = formatWordCountLabel(heroImageAlt);
  const heroImageCaptionWordCountLabel = formatWordCountLabel(heroImageCaption);
  const metaTitleWordCountLabel = formatWordCountLabel(metaTitle);
  const metaDescriptionWordCountLabel = formatWordCountLabel(metaDescription);
  const articlePlainText = useMemo(
    () =>
      normalizeArticleContent(renderedTemplatePreview)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    [renderedTemplatePreview],
  );
  const articleWordCount = countWords(articlePlainText);
  const seoScore = Math.min(
    100,
    [
      title.trim() ? 20 : 0,
      excerpt.trim() ? 15 : 0,
      metaTitle.trim() ? 20 : 0,
      metaDescription.trim() ? 20 : 0,
      activeTagList.length ? 10 : 0,
      editorHasContent ? 15 : 0,
    ].reduce((sum, value) => sum + value, 0),
  );
  const seoScoreLabel =
    seoScore >= 85 ? "Great job!" : seoScore >= 65 ? "Almost there" : "Needs work";
  const seoScorePercent = Math.max(0, Math.min(100, Number(seoScore) || 0));
  const focusKeywordValue = activeTagList[0] || "";
  const focusKeywordWordCountLabel = formatWordCountLabel(focusKeywordValue);
  const authorNameWordCountLabel = formatWordCountLabel(authorName);
  const isLoadingStoryMessage = message === "Loading selected story...";
  const focusSlugField = () => {
    setComposerSidebarTab("block");
    setTimeout(() => {
      slugInputRef.current?.focus();
      slugInputRef.current?.select?.();
    }, 40);
  };
  const focusTagsField = () => {
    setComposerSidebarTab("post");
    setTimeout(() => {
      tagsInputRef.current?.focus();
    }, 40);
  };

  return (
    <div
      className="mx-auto flex w-full max-w-[1720px] flex-col gap-8 px-1 py-2"
    >
      {workspaceView === "listing" ? (
        <div className="px-1 py-1 sm:px-2">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-[2.15rem] font-semibold tracking-[-0.04em] text-slate-950">
                All Posts
              </h1>
              <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-600">
                Manage and organize all your blog posts in one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={exportLibraryCsv}
                  disabled={filteredLibrary.length === 0}
                  className="inline-flex h-11 items-center justify-center gap-2 border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 md:px-5"
                >
                  <FaDownload className="text-xs" />
                  Export
                </button>

                <div className="relative inline-flex border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPostMenuOpen(false);
                      startNewGeneralArticle();
                    }}
                    className="inline-flex h-11 items-center gap-2 bg-[#5B2EFF] px-3 text-sm font-semibold text-white transition hover:bg-[#4D23E0] md:px-5"
                  >
                    <FaPlus className="text-xs" />
                    New Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPostMenuOpen((prev) => !prev)}
                    className="inline-flex h-11 items-center border-l border-white/20 bg-[#5B2EFF] px-3 text-white transition hover:bg-[#4D23E0]"
                  >
                    <FaChevronDown className="text-xs" />
                  </button>

                  {newPostMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-56 overflow-hidden border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => {
                          setNewPostMenuOpen(false);
                          startNewGeneralArticle();
                        }}
                        className="flex w-full items-start border-b border-slate-200 px-3 py-3 text-left transition hover:bg-slate-50"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            General article
                          </div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">
                            Start a normal post not linked to a product.
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPostMenuOpen(false);
                          startNewProductStory();
                        }}
                        className="flex w-full items-start px-3 py-3 text-left transition hover:bg-slate-50"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Product-linked story
                          </div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">
                            Build a post from a connected device profile.
                          </div>
                        </div>
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
          </div>
        </div>
      ) : (
        <div className="px-1 py-1 sm:px-2">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>Dashboard</span>
                <FaChevronRight className="text-[10px] text-slate-300" />
                <span>Blog</span>
                <FaChevronRight className="text-[10px] text-slate-300" />
                <button
                  type="button"
                  onClick={() => setWorkspaceView("listing")}
                  className="transition hover:text-slate-900"
                >
                  All Posts
                </button>
                <FaChevronRight className="text-[10px] text-slate-300" />
                <span className="text-slate-700">{composerCrumbLabel}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-[2.1rem] font-semibold tracking-[-0.04em] text-slate-950">
                  {composerEntryLabel}
                </h1>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${LISTING_STATUS_BADGES[composerStatusKey] || LISTING_STATUS_BADGES.draft}`}
                >
                  {composerStatusLabel}
                </span>
              </div>

              <p className="mt-2 text-[15px] text-slate-600">
                Last updated: {composerUpdatedLabel}
                {authorName ? ` by ${authorName}` : ""}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => saveBlog("draft")}
                disabled={saving}
                className={`${composerButtonClassName} h-11 px-5 disabled:opacity-60`}
              >
                {saving && status !== "published" ? "Saving..." : "Save as Draft"}
              </button>

              <button
                type="button"
                onClick={() => setComposerPreviewOpen(true)}
                className={`${composerButtonClassName} h-11 gap-2 px-5`}
              >
                <FaRegEye className="text-sm" />
                Preview
              </button>

              <div className="inline-flex overflow-hidden border border-slate-200">
                <button
                  type="button"
                  onClick={() => saveBlog("published")}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 bg-[#5B2EFF] px-5 text-sm font-semibold text-white transition hover:bg-[#4D23E0] disabled:opacity-60"
                >
                  <FaUpload className="text-[11px]" />
                  {saving && status === "published" ? "Publishing..." : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => setComposerSidebarTab("post")}
                  className="inline-flex h-11 items-center justify-center border-l border-white/20 bg-[#5B2EFF] px-3 text-white transition hover:bg-[#4D23E0]"
                >
                  <FaChevronDown className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="border border-red-200 bg-red-50 px-2 py-3 text-red-700 md:px-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center border border-red-200 bg-white/70 text-red-600">
              <span className="text-sm font-semibold">!</span>
            </div>
            <div>
              <div className="text-sm font-semibold">Something went wrong</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        </div>
      ) : null}

      {message ? (
        <div
          className={`border px-2 py-3 md:px-4 ${
            isLoadingStoryMessage
              ? "border-sky-200 bg-[linear-gradient(90deg,#f8fbff_0%,#eef6ff_100%)] text-sky-700"
              : "border-emerald-200 bg-[linear-gradient(90deg,#f7fdf9_0%,#eefbf3_100%)] text-emerald-700"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-8 w-8 items-center justify-center border bg-white/75 ${
                isLoadingStoryMessage
                  ? "border-sky-200 text-sky-600"
                  : "border-emerald-200 text-emerald-600"
              }`}
            >
              {isLoadingStoryMessage ? (
                <FaSyncAlt className="animate-spin text-xs" />
              ) : (
                <FaCheckCircle className="text-xs" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold">
                {isLoadingStoryMessage ? "Opening story" : "Workspace updated"}
              </div>
              <div className="mt-1 text-sm">{message}</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-5">
        {workspaceView === "listing" ? (
          <div className="overflow-hidden border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-2 py-4 md:px-6 md:py-6">
              <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,0.95fr))_auto_auto]">
                <div className="relative min-w-0">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 md:left-4" />
                  <input
                    value={libraryQuery}
                    onChange={(event) => setLibraryQuery(event.target.value)}
                    placeholder="Search posts by title, keyword..."
                    className="h-11 w-full border border-slate-200 bg-white pl-10 pr-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-0 md:pl-11 md:pr-4"
                  />
                </div>

                <select
                  value={libraryCategoryFilter}
                  onChange={(event) =>
                    setLibraryCategoryFilter(event.target.value)
                  }
                  className={listingFieldClassName}
                >
                  <option value="all">All Categories</option>
                  {libraryCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {getCategoryLabel(option)}
                    </option>
                  ))}
                </select>

                <select
                  value={libraryAuthorFilter}
                  onChange={(event) => setLibraryAuthorFilter(event.target.value)}
                  className={listingFieldClassName}
                >
                  <option value="all">All Authors</option>
                  {libraryAuthorOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <select
                  value={libraryStatus}
                  onChange={(event) => setLibraryStatus(event.target.value)}
                  className={listingFieldClassName}
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>

                <button
                  type="button"
                  onClick={() => loadLibrary()}
                  disabled={libraryLoading}
                  className={`${listingButtonClassName} disabled:opacity-60`}
                >
                  {libraryLoading ? (
                    <FaSyncAlt className="animate-spin text-xs" />
                  ) : (
                    <FaFilter className="text-xs" />
                  )}
                  Filter
                </button>

                <button
                  type="button"
                  onClick={clearLibraryFilters}
                  className={listingButtonClassName}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border-b border-slate-200">
              <div className="flex min-w-max">
                {libraryStatusTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setLibraryTab(tab.key)}
                    className={`inline-flex items-center gap-3 border-r border-slate-200 px-3 py-3 text-sm font-semibold transition md:px-4 ${
                      libraryTab === tab.key
                        ? "bg-slate-50 text-[#5138EE]"
                        : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`border px-2 py-1 text-[11px] font-bold ${
                        libraryTab === tab.key
                          ? tab.pillClassName
                          : "border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {libraryError ? (
              <div className="border-b border-slate-200 bg-red-50 px-2 py-3 text-sm text-red-700 md:px-4">
                {libraryError}
              </div>
            ) : null}

            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-[980px] w-full divide-y divide-slate-200">
                <thead className="bg-white">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                    <th className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={areAllPageRowsSelected}
                        onChange={toggleLibrarySelectionForPage}
                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                    </th>
                    <th className="min-w-[560px] px-4 py-4">Title</th>
                    <th className="w-[180px] px-4 py-4">Author</th>
                    <th className="w-[200px] px-4 py-4">Category</th>
                    <th className="w-[130px] px-4 py-4">Status</th>
                    <th className="w-[170px] px-4 py-4">Published On</th>
                    <th className="w-[140px] px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {libraryLoading && libraryRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        Loading content library...
                      </td>
                    </tr>
                  ) : paginatedLibrary.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        {libraryTab === "trash"
                          ? "Trash view is ready for future deleted-record support."
                          : "No posts match the current filters."}
                      </td>
                    </tr>
                  ) : (
                    paginatedLibrary.map((row) => {
                      const rowId = Number(row.id);
                      const rowCategory =
                        row.category ||
                        (row.product_id
                          ? getDefaultStoryCategory("product")
                          : getDefaultStoryCategory("general"));
                      const rowStatus = getListingStatusKey(row);
                      const publishedDate = formatDateParts(row.published_at);

                      return (
                        <tr
                          key={row.id}
                          className={`align-top transition ${
                            selectedLibraryId === row.id
                              ? "bg-violet-50/70"
                              : "bg-white hover:bg-slate-50/70"
                          }`}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedLibraryIds.includes(rowId)}
                              onChange={() => toggleLibrarySelection(rowId)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-start gap-4">
                              <div className="h-14 w-20 shrink-0 overflow-hidden border border-slate-200 bg-slate-100">
                                {row.hero_image ? (
                                  <img
                                    src={row.hero_image}
                                    alt={
                                      row.hero_image_alt ||
                                      row.title ||
                                      "Story cover"
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center bg-slate-100 text-slate-500">
                                    <FaNewspaper className="text-lg" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="line-clamp-2 w-full text-[15px] font-semibold leading-6 text-slate-950">
                                  {row.title || "Untitled content"}
                                </div>
                                <div className="mt-1 truncate text-xs text-slate-500">
                                  {row.slug
                                    ? `/blog/${row.slug}`
                                    : "Slug will be generated on save"}
                                </div>
                                {row.product_names ? (
                                  <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                                    Products: {row.product_names}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                                {getAuthorInitials(row.author_name)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900">
                                  {row.author_name || "No byline"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center border text-[10px] ${getCategoryBadgeClassName(
                                  rowCategory,
                                )}`}
                              >
                                <FaTag className="text-[10px]" />
                              </span>
                              <span className="text-sm font-medium text-slate-700">
                                {getCategoryLabel(rowCategory)}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold ${
                                LISTING_STATUS_BADGES[rowStatus]
                              }`}
                            >
                              {getListingStatusLabel(row)}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-700">
                            <div className="font-semibold text-slate-900">
                              {publishedDate.dateLabel}
                            </div>
                            {publishedDate.timeLabel ? (
                              <div className="mt-1 text-sm font-medium text-slate-900">
                                {publishedDate.timeLabel}
                              </div>
                            ) : null}
                          </td>

                          <td className="px-4 py-4">
                            <div className="relative flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleLibrarySelect(row)}
                                disabled={
                                  loadingEntryId === row.id ||
                                  deletingId === row.id
                                }
                                className={`${listingIconButtonClassName} disabled:opacity-60`}
                                title="Open in composer"
                              >
                                <FaPen className="text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() => copyBlogPermalink(row)}
                                disabled={!row.slug}
                                className={`${listingIconButtonClassName} disabled:cursor-not-allowed disabled:opacity-40`}
                                title="Copy public link"
                              >
                                <FaCopy className="text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setLibraryActionMenuId((prev) =>
                                    prev === row.id ? null : row.id,
                                  )
                                }
                                className={`${listingIconButtonClassName} disabled:opacity-60`}
                                title="More actions"
                              >
                                <FaEllipsisV className="text-xs" />
                              </button>

                              {libraryActionMenuId === row.id ? (
                                <div className="absolute right-0 top-[calc(100%+0.4rem)] z-20 w-40 overflow-hidden border border-slate-200 bg-white">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLibraryActionMenuId(null);
                                      handleLibrarySelect(row);
                                    }}
                                    className="flex w-full items-center border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Edit post
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLibraryActionMenuId(null);
                                      void copyBlogPermalink(row);
                                    }}
                                    className="flex w-full items-center border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Copy link
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLibraryActionMenuId(null);
                                      void deleteBlog(row);
                                    }}
                                    className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                  >
                                    Delete post
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden">
              {libraryLoading && libraryRows.length === 0 ? (
                <div className="px-2 py-12 text-center text-sm text-slate-500 md:px-4">
                  Loading content library...
                </div>
              ) : paginatedLibrary.length === 0 ? (
                <div className="px-2 py-12 text-center text-sm text-slate-500 md:px-4">
                  {libraryTab === "trash"
                    ? "Trash view is ready for future deleted-record support."
                    : "No posts match the current filters."}
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {paginatedLibrary.map((row) => {
                    const rowId = Number(row.id);
                    const rowCategory =
                      row.category ||
                      (row.product_id
                        ? getDefaultStoryCategory("product")
                        : getDefaultStoryCategory("general"));
                    const rowStatus = getListingStatusKey(row);
                    const publishedDate = formatDateParts(row.published_at);

                    return (
                      <article
                        key={`mobile-${row.id}`}
                        className={`px-2 py-4 md:px-4 ${
                          selectedLibraryId === row.id ? "bg-violet-50/70" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedLibraryIds.includes(rowId)}
                            onChange={() => toggleLibrarySelection(rowId)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />

                          <div className="h-14 w-16 shrink-0 overflow-hidden border border-slate-200 bg-slate-100">
                            {row.hero_image ? (
                              <img
                                src={row.hero_image}
                                alt={
                                  row.hero_image_alt ||
                                  row.title ||
                                  "Story cover"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-slate-100 text-slate-500">
                                <FaNewspaper className="text-base" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 text-[15px] font-semibold leading-6 text-slate-950">
                              {row.title || "Untitled content"}
                            </div>
                            <div className="mt-1 truncate text-xs text-slate-500">
                              {row.slug
                                ? `/blog/${row.slug}`
                                : "Slug will be generated on save"}
                            </div>
                            {row.product_names ? (
                              <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                                Products: {row.product_names}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-200 pt-3 text-xs">
                          <div>
                            <div className="uppercase tracking-[0.08em] text-slate-400">
                              Author
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {row.author_name || "No byline"}
                            </div>
                          </div>
                          <div>
                            <div className="uppercase tracking-[0.08em] text-slate-400">
                              Category
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-700">
                              {getCategoryLabel(rowCategory)}
                            </div>
                          </div>
                          <div>
                            <div className="uppercase tracking-[0.08em] text-slate-400">
                              Status
                            </div>
                            <span
                              className={`mt-1 inline-flex border px-2 py-1 text-[11px] font-semibold ${
                                LISTING_STATUS_BADGES[rowStatus]
                              }`}
                            >
                              {getListingStatusLabel(row)}
                            </span>
                          </div>
                          <div>
                            <div className="uppercase tracking-[0.08em] text-slate-400">
                              Published
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-700">
                              {publishedDate.dateLabel}
                              {publishedDate.timeLabel ? `, ${publishedDate.timeLabel}` : ""}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                          <button
                            type="button"
                            onClick={() => handleLibrarySelect(row)}
                            disabled={
                              loadingEntryId === row.id || deletingId === row.id
                            }
                            className="inline-flex h-9 items-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                          >
                            <FaPen className="text-[11px]" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => copyBlogPermalink(row)}
                            disabled={!row.slug}
                            className="inline-flex h-9 items-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <FaCopy className="text-[11px]" />
                            Copy Link
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteBlog(row)}
                            className="inline-flex h-9 items-center gap-2 border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                          >
                            <FaTrashAlt className="text-[11px]" />
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 px-2 py-4 md:px-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center">
                <span>
                  Showing {currentPageRangeStart} to {currentPageRangeEnd} of{" "}
                  {filteredLibrary.length} results
                </span>
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <select
                    value={libraryPageSize}
                    onChange={(event) =>
                      setLibraryPageSize(Number(event.target.value) || 10)
                    }
                    className="h-10 border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-0 md:px-3"
                  >
                    {[10, 20, 50].map((size) => (
                      <option key={size} value={size}>
                        {size} per page
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setLibraryPage((prev) => Math.max(1, prev - 1))}
                  disabled={libraryPage <= 1}
                  className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  <FaChevronLeft className="text-xs" />
                </button>

                <div className="flex items-center gap-2 overflow-x-auto">
                  {paginationItems.map((item, index) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-sm text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLibraryPage(Number(item))}
                        className={`inline-flex h-10 min-w-[2.5rem] items-center justify-center border px-3 text-sm font-semibold transition ${
                          libraryPage === item
                            ? "border-violet-600 bg-violet-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setLibraryPage((prev) =>
                      Math.min(totalLibraryPages, prev + 1),
                    )
                  }
                  disabled={libraryPage >= totalLibraryPages}
                  className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        ) : null}

      {workspaceView === "composer" ? (
        <div className="px-1 pb-8 sm:px-2">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_352px] xl:gap-0">
            <div className="space-y-5">
              <div
                id="story-editor-panel"
                className="overflow-hidden border border-slate-200 bg-white"
              >
                <div className="px-2 py-5 md:px-6 md:py-6">
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-900">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Enter the post title"
                        className="h-12 w-full border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-0 md:px-4"
                      />
                      <div className="mt-2 text-right text-xs font-medium text-slate-400">
                        {titleWordCountLabel}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 truncate text-slate-600">
                        <span className="font-medium text-slate-500">
                          Permalink:
                        </span>{" "}
                        {editorPermalinkDisplay}
                      </div>
                      <button
                        type="button"
                        onClick={focusSlugField}
                        className="inline-flex h-8 items-center justify-center border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                      >
                        Edit
                      </button>
                    </div>

                    <div>
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label className="text-sm font-semibold text-slate-900">
                          Content
                        </label>
                        <div className="text-xs font-medium text-slate-400">
                          {editorSelectionLabel}
                        </div>
                      </div>

                      <div className="overflow-hidden border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 bg-white px-3 py-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <select
                              value={editorBlockModeValue}
                              onChange={(event) =>
                                applyEditorBlockMode(event.target.value)
                              }
                              className="h-9 min-w-[138px] border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-0"
                            >
                              <option value="paragraph">Paragraph</option>
                              <option value="h2">Heading 2</option>
                              <option value="h3">Heading 3</option>
                              <option value="code">Code Block</option>
                              <option value="quote">Quote</option>
                              <option value="bullets">Bullet List</option>
                              <option value="numbers">Numbered List</option>
                            </select>

                            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () => storyEditorRef.current?.toggleBold?.(),
                                )
                              }
                              className={getComposerIconButtonClassName(
                                editorUiState.isBold,
                              )}
                              title="Bold"
                            >
                              <FaBold />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () => storyEditorRef.current?.toggleItalic?.(),
                                )
                              }
                              className={getComposerIconButtonClassName(
                                editorUiState.isItalic,
                              )}
                              title="Italic"
                            >
                              <FaItalic />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () =>
                                    storyEditorRef.current?.toggleUnderline?.(),
                                )
                              }
                              className={getComposerIconButtonClassName(
                                editorUiState.isUnderline,
                              )}
                              title="Underline"
                            >
                              <FaUnderline />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () => storyEditorRef.current?.toggleStrike?.(),
                                )
                              }
                              className={getComposerIconButtonClassName(
                                editorUiState.isStrike,
                              )}
                              title="Strikethrough"
                            >
                              <FaStrikethrough />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(event, applyLink)
                              }
                              className={getComposerIconButtonClassName(
                                editorUiState.isLink,
                              )}
                              title="Add link"
                            >
                              <FaLink />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () => storyEditorRef.current?.unsetLink?.(),
                                  !editorUiState.isLink,
                                )
                              }
                              className={getComposerIconButtonClassName(
                                false,
                                !editorUiState.isLink,
                              )}
                              title="Remove link"
                            >
                              <FaLink className="opacity-55" />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () => openInlineImagePicker(),
                                  uploadingInlineImage,
                                )
                              }
                              className={getComposerIconButtonClassName(
                                false,
                                uploadingInlineImage,
                              )}
                              title="Upload image"
                            >
                              <FaImage />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  insertEmbedPlaceholder,
                                )
                              }
                              className={getComposerIconButtonClassName(false)}
                              title="Insert embed block"
                            >
                              <FaNewspaper />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () =>
                                    storyEditorRef.current?.toggleBlockquote?.(),
                                )
                              }
                              className={getComposerIconButtonClassName(
                                editorUiState.isBlockquote,
                              )}
                              title="Quote"
                            >
                              <FaQuoteRight />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () =>
                                    storyEditorRef.current?.toggleBulletList?.(),
                                )
                              }
                              className={getComposerIconButtonClassName(
                                editorUiState.isBulletList,
                              )}
                              title="Bullet list"
                            >
                              <FaListUl />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () =>
                                    storyEditorRef.current?.toggleOrderedList?.(),
                                )
                              }
                              className={getComposerIconButtonClassName(
                                editorUiState.isOrderedList,
                              )}
                              title="Numbered list"
                            >
                              <FaListOl />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(event, insertTableLayout)
                              }
                              className={getComposerIconButtonClassName(false)}
                              title="Insert table"
                            >
                              <FaTable />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () =>
                                    storyEditorRef.current?.toggleCodeBlock?.(),
                                )
                              }
                              className={getComposerIconButtonClassName(
                                editorUiState.isCodeBlock,
                              )}
                              title="Code block"
                            >
                              <FaCode />
                            </button>

                            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () => storyEditorRef.current?.undo?.(),
                                  !editorUiState.canUndo,
                                )
                              }
                              className={getComposerIconButtonClassName(
                                false,
                                !editorUiState.canUndo,
                              )}
                              title="Undo"
                            >
                              <FaUndo />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () => storyEditorRef.current?.redo?.(),
                                  !editorUiState.canRedo,
                                )
                              }
                              className={getComposerIconButtonClassName(
                                false,
                                !editorUiState.canRedo,
                              )}
                              title="Redo"
                            >
                              <FaRedo />
                            </button>
                            <button
                              type="button"
                              onClick={() => setComposerSidebarTab("block")}
                              className="ml-auto inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                              title="More options"
                            >
                              <FaEllipsisV />
                            </button>
                          </div>
                        </div>

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

                        <div className="min-h-[580px] bg-white">
                          <TiptapStoryEditor
                            ref={storyEditorRef}
                            value={contentTemplate}
                            onChange={setContentTemplate}
                            onEditorStateChange={setEditorUiState}
                            normalizeContent={buildEditorSurfaceHtml}
                            className="min-h-[580px]"
                          />
                        </div>

                        <div className="flex flex-col gap-2 border-t border-slate-200 px-2 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <span>Words: {articleWordCount}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span>
                              {message ? "Saved a few seconds ago" : "Editing in progress"}
                            </span>
                            <span className="font-medium text-slate-700">
                              {saving
                                ? "Saving..."
                                : composerStatusLabel === "Published"
                                  ? "Published"
                                  : "Draft saved"}
                            </span>
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                                message
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              <FaCheckCircle className="text-[10px]" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="space-y-0 xl:sticky xl:top-6 xl:self-start xl:border-l xl:border-slate-200">
              <div className="border-b border-slate-200 px-2 md:px-4">
                <div className="grid grid-cols-2">
                  {[
                    { key: "post", label: "Post" },
                    { key: "block", label: "Block" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setComposerSidebarTab(tab.key)}
                      className={`relative px-2 py-3 text-sm font-semibold transition md:px-4 ${
                        composerSidebarTab === tab.key
                          ? "text-[#5B34E6]"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                      {composerSidebarTab === tab.key ? (
                        <span className="absolute inset-x-4 bottom-0 h-px bg-[#5B34E6]" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              {composerSidebarTab === "post" ? (
                <>
                  <div className="border-b border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Status & Visibility
                      </h3>
                    </div>
                    <div className="space-y-4 px-2 py-4 md:px-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Status
                        </label>
                        <select
                          value={status}
                          onChange={(event) => setStatus(event.target.value)}
                          className={composerFieldClassName}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Visibility
                        </label>
                        <select
                          value="public"
                          readOnly
                          className={composerFieldClassName}
                        >
                          <option value="public">Public</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Published on
                        </label>
                        <input
                          type="datetime-local"
                          value={publishedAt}
                          onChange={(event) => setPublishedAt(event.target.value)}
                          className={composerFieldClassName}
                        />
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
                              product_ids:
                                blogMode === "product" ? selectedProductIds : [],
                              products:
                                blogMode === "product" ? selectedProducts : [],
                              product_type:
                                blogMode === "product" ? productType : null,
                            })
                          }
                          disabled={deletingId === blogId}
                          className={`${composerDangerButtonClassName} h-11 px-2 disabled:opacity-60 md:px-4`}
                        >
                          {deletingId === blogId ? "Moving..." : "Move to Trash"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Categories
                      </h3>
                      <button
                        type="button"
                        onClick={() => setComposerSidebarTab("block")}
                        className="text-xs font-semibold text-[#5B34E6] transition hover:text-[#4524c7]"
                      >
                        Add New Category
                      </button>
                    </div>
                    <div className="space-y-3 px-2 py-4 md:px-4">
                      {STORY_CATEGORY_OPTIONS.map((option) => {
                        const checked =
                          String(category || "").trim().toLowerCase() ===
                          option.value;

                        return (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setCategory(option.value)}
                              className="h-4 w-4 rounded border-slate-300 text-[#5B34E6] focus:ring-[#5B34E6]"
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setComposerSidebarTab("block")}
                        className="pt-1 text-sm font-medium text-[#5B34E6] transition hover:text-[#4524c7]"
                      >
                        View All Categories
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Tags
                      </h3>
                      <button
                        type="button"
                        onClick={focusTagsField}
                        className="text-xs font-semibold text-[#5B34E6] transition hover:text-[#4524c7]"
                      >
                        Add New Tag
                      </button>
                    </div>
                    <div className="px-2 py-4 md:px-4">
                      <div className="flex flex-wrap gap-2">
                        {activeTagList.length ? (
                          activeTagList.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setTagsInput(
                                  activeTagList
                                    .filter((value) => value !== tag)
                                    .join(", "),
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-full bg-[#F3EEFF] px-3 py-1 text-xs font-medium text-[#5B34E6]"
                            >
                              <span>{tag}</span>
                              <span className="text-[10px]">x</span>
                            </button>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400">
                            No tags added yet
                          </span>
                        )}
                      </div>
                      <input
                        ref={tagsInputRef}
                        value={tagsInput}
                        onChange={(event) => setTagsInput(event.target.value)}
                        placeholder="Press comma to separate tags"
                        className={`mt-3 ${composerFieldClassName}`}
                      />
                      <div className="mt-2 text-xs text-slate-400">
                        Press Enter or comma to add more tags
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Excerpt
                      </h3>
                    </div>
                    <div className="px-2 py-4 md:px-4">
                      <textarea
                        value={excerpt}
                        onChange={(event) => setExcerpt(event.target.value)}
                        rows={4}
                        placeholder="Write a short summary for cards and search results"
                        className={composerTextareaClassName}
                      />
                      <div className="mt-2 text-right text-xs font-medium text-slate-400">
                        {excerptWordCountLabel}
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Thumbnail Image
                      </h3>
                    </div>
                    <div className="space-y-4 px-2 py-4 md:px-4">
                      <div className="overflow-hidden border border-slate-200 bg-slate-50">
                        <div className="aspect-[16/9]">
                          {heroImage ? (
                            <img
                              src={heroImage}
                              alt={heroImageAlt || defaultHeroAltText}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
                              <div>
                                <FaImage className="mx-auto text-2xl" />
                                <div className="mt-3">
                                  No thumbnail selected for this story
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={openHeroImagePicker}
                          disabled={uploadingHeroImage}
                          className={`${composerButtonClassName} h-11 px-4 disabled:opacity-60`}
                        >
                          <FaUpload className="text-xs" />
                          {uploadingHeroImage ? "Uploading..." : "Upload Image"}
                        </button>

                        {blogMode === "product" && defaultSelectedProductImage ? (
                          <button
                            type="button"
                            onClick={handleUsePrimaryProductImage}
                            className={`${composerButtonClassName} h-11 px-4`}
                          >
                            Use Product Image
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={handleRemoveHeroImage}
                          disabled={
                            !heroImage &&
                            currentHeroImageSource === HERO_IMAGE_SOURCE.NONE
                          }
                          className={`${composerDangerButtonClassName} h-11 px-4 disabled:opacity-60`}
                        >
                          <FaTrashAlt className="text-xs" />
                          Remove
                        </button>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Image URL
                        </label>
                        <input
                          value={
                            currentHeroImageSource === HERO_IMAGE_SOURCE.NONE
                              ? ""
                              : heroImage
                          }
                          onChange={(event) => {
                            const nextValue = String(event.target.value || "").trim();
                            setHeroImage(nextValue);
                            setHeroImageSource(
                              nextValue
                                ? HERO_IMAGE_SOURCE.URL
                                : HERO_IMAGE_SOURCE.NONE,
                            );
                          }}
                          placeholder="https://example.com/story-thumbnail.jpg"
                          className={composerFieldClassName}
                        />
                        <div className="mt-2 text-xs leading-5 text-slate-500">
                          {blogMode === "product"
                            ? "Upload a custom thumbnail, paste an image URL, or switch back to the primary product image."
                            : "Upload a custom thumbnail or paste an external image URL."}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Alt Text
                        </label>
                        <input
                          value={heroImageAlt}
                          onChange={(event) => setHeroImageAlt(event.target.value)}
                          placeholder={defaultHeroAltText}
                          className={composerFieldClassName}
                        />
                        <div className="mt-1 text-right text-xs font-medium text-slate-400">
                          {heroImageAltWordCountLabel}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Caption
                        </label>
                        <textarea
                          value={heroImageCaption}
                          onChange={(event) =>
                            setHeroImageCaption(event.target.value)
                          }
                          rows={3}
                          placeholder="Optional photo caption or credit"
                          className={composerTextareaClassName}
                        />
                        <div className="mt-1 text-right text-xs font-medium text-slate-400">
                          {heroImageCaptionWordCountLabel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        SEO
                      </h3>
                      <span className="text-xs font-semibold text-[#5B34E6]">
                        Edit Snippet
                      </span>
                    </div>
                    <div className="space-y-4 px-2 py-4 md:px-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          SEO Title
                        </label>
                        <input
                          value={metaTitle}
                          onChange={(event) => setMetaTitle(event.target.value)}
                          className={composerFieldClassName}
                        />
                        <div className="mt-1 text-right text-xs font-medium text-slate-400">
                          {metaTitleWordCountLabel}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Meta Description
                        </label>
                        <textarea
                          value={metaDescription}
                          onChange={(event) =>
                            setMetaDescription(event.target.value)
                          }
                          rows={3}
                          className={composerTextareaClassName}
                        />
                        <div className="mt-1 text-right text-xs font-medium text-slate-400">
                          {metaDescriptionWordCountLabel}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Focus Keyword
                        </label>
                        <input
                          value={focusKeywordValue}
                          onChange={(event) => {
                            const nextKeyword = String(
                              event.target.value || "",
                            ).trim();
                            const nextTags = [...activeTagList];

                            if (nextKeyword) {
                              if (nextTags.length) {
                                nextTags[0] = nextKeyword;
                              } else {
                                nextTags.push(nextKeyword);
                              }
                            } else if (nextTags.length) {
                              nextTags.shift();
                            }

                            setTagsInput(
                              Array.from(new Set(nextTags.filter(Boolean))).join(
                                ", ",
                              ),
                            );
                          }}
                          className={composerFieldClassName}
                        />
                        <div className="mt-1 text-right text-xs font-medium text-slate-400">
                          {focusKeywordWordCountLabel}
                        </div>
                      </div>

                      <div className="border border-emerald-100 bg-emerald-50 px-2 py-3 md:px-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-emerald-700">
                            SEO Score: {seoScore} / 100
                          </div>
                          <div className="text-xs font-semibold text-emerald-700">
                            {seoScoreLabel}
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/80">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-lime-500 transition-all"
                            style={{ width: `${seoScorePercent}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-emerald-700/80">
                          Improve the title, summary, and focus keyword coverage to strengthen organic reach.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Story Setup
                      </h3>
                    </div>
                    <div className="space-y-4 px-2 py-4 md:px-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Post Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => startNewGeneralArticle()}
                            className={`border px-3 py-2.5 text-sm font-semibold transition ${
                              blogMode === "general"
                                ? "border-[#CFC3FF] bg-[#F3EEFF] text-[#5B34E6]"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            General
                          </button>
                          <button
                            type="button"
                            onClick={() => startNewProductStory(productType)}
                            className={`border px-3 py-2.5 text-sm font-semibold transition ${
                              blogMode === "product"
                                ? "border-[#CFC3FF] bg-[#F3EEFF] text-[#5B34E6]"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            Product Linked
                          </button>
                        </div>
                      </div>

                      {blogMode === "product" ? (
                        <>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Product Type
                            </label>
                            <select
                              value={productType}
                              onChange={(event) => setProductType(event.target.value)}
                              className={composerFieldClassName}
                            >
                              <option value="smartphone">Smartphones</option>
                              <option value="laptop">Laptops</option>
                              <option value="tv">TVs</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Candidate Product
                            </label>
                            <div className="flex gap-2">
                              <select
                                value={candidateProductId || ""}
                                onChange={(event) =>
                                  setCandidateProductId(
                                    Number(event.target.value) || null,
                                  )
                                }
                                disabled={candidatesLoading || candidates.length === 0}
                                className={`${composerFieldClassName} disabled:bg-slate-50`}
                              >
                                {candidates.length === 0 ? (
                                  <option value="">
                                    {candidatesLoading ? "Loading..." : "No candidates"}
                                  </option>
                                ) : null}
                                {candidates.map((row) => (
                                  <option key={row.product_id} value={row.product_id}>
                                    {row.name} ({row.brand_name || "Brand"})
                                    {selectedProductIds.includes(Number(row.product_id))
                                      ? " - Linked"
                                      : ""}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={handleAddCandidateProduct}
                                disabled={
                                  !candidateProductId ||
                                  candidatesLoading ||
                                  selectedProductIds.includes(
                                    Number(candidateProductId),
                                  )
                                }
                                className={`${composerButtonClassName} h-11 shrink-0 px-4 disabled:opacity-50`}
                              >
                                Add
                              </button>
                            </div>
                            <div className="mt-2 text-xs leading-5 text-slate-500">
                              Change the type filter anytime to add smartphones,
                              laptops, and TVs into one story.
                            </div>
                            {selectedCandidateProduct ? (
                              <div className="mt-3 flex items-center gap-3 border border-slate-200 bg-white px-3 py-3">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-100">
                                  {selectedCandidateProductImage ? (
                                    <img
                                      src={selectedCandidateProductImage}
                                      alt={selectedCandidateProduct?.name || "Product"}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                                      <FaImage className="text-lg" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-semibold text-slate-900">
                                    {selectedCandidateProduct?.name || "Unnamed product"}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {[
                                      selectedCandidateProduct?.brand_name,
                                      selectedCandidateProduct?.product_type,
                                    ]
                                      .filter(Boolean)
                                      .join(" / ") || "Product details"}
                                  </div>
                                  <div className="mt-1 text-sm text-slate-700">
                                    {selectedCandidateProduct?.price || "No price"}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="border border-slate-200 bg-slate-50 px-2 py-4 text-sm text-slate-700 md:px-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Linked Products
                            </div>
                            {selectedProducts.length === 0 ? (
                              <div className="mt-2 text-sm leading-6 text-slate-500">
                                Add products from the candidate list to build a
                                multi-product story. The first linked item becomes
                                the primary product for hero defaults and summary
                                tokens.
                              </div>
                            ) : (
                              <div className="mt-3 space-y-3">
                                {selectedProducts.map((product, index) => {
                                  const productThumbnail = getProductThumbnail(product);

                                  return (
                                    <div
                                      key={product.product_id}
                                      className="border border-slate-200 bg-white px-3 py-3"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-100">
                                            {productThumbnail ? (
                                              <img
                                                src={productThumbnail}
                                                alt={product?.name || "Product"}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                                <FaImage className="text-lg" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <div className="font-semibold text-slate-900">
                                                {product?.name || "Unnamed product"}
                                              </div>
                                              {index === 0 ? (
                                                <span className="inline-flex border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                                  Primary
                                                </span>
                                              ) : null}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                              {[product?.brand_name, product?.product_type]
                                                .filter(Boolean)
                                                .join(" / ") || "Product details"}
                                            </div>
                                            <div className="mt-1 text-sm text-slate-700">
                                              {product?.price || "-"}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex shrink-0 gap-2">
                                          {index > 0 ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleSetPrimaryProduct(
                                                  Number(product.product_id),
                                                )
                                              }
                                              className="inline-flex h-8 items-center justify-center border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                            >
                                              Make Primary
                                            </button>
                                          ) : null}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveSelectedProduct(
                                                Number(product.product_id),
                                              )
                                            }
                                            className="inline-flex h-8 items-center justify-center border border-red-200 bg-red-50 px-3 text-[11px] font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="border border-slate-200 bg-slate-50 px-2 py-4 text-sm text-slate-700 md:px-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Primary Product Snapshot
                            </div>
                            <div className="mt-3 flex items-start gap-3">
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white">
                                {selectedPrimaryProductImage ? (
                                  <img
                                    src={selectedPrimaryProductImage}
                                    alt={selectedProduct?.name || "Primary product"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                                    <FaImage className="text-xl" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900">
                                  {selectedProduct?.name || "-"}
                                </div>
                                <div className="mt-1">
                                  {selectedProduct?.brand_name || "-"}
                                </div>
                                <div className="mt-1">{selectedProduct?.price || "-"}</div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="border border-indigo-100 bg-indigo-50 px-2 py-4 text-sm leading-6 text-indigo-700 md:px-4">
                          General article mode is best for explainers, roundups,
                          and editorial posts that are not tied to one product.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Author & Permalink
                      </h3>
                    </div>
                    <div className="space-y-4 px-2 py-4 md:px-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Author
                        </label>
                        <select
                          value={authorUserId}
                          onChange={(event) => {
                            const nextAuthorId = event.target.value;
                            setAuthorUserId(nextAuthorId);
                            const selectedAuthor = authorOptions.find(
                              (option) =>
                                String(option.value) === String(nextAuthorId),
                            );
                            if (selectedAuthor?.label) {
                              setAuthorName(selectedAuthor.label);
                            }
                          }}
                          className={composerFieldClassName}
                        >
                          <option value="">Custom byline</option>
                          {authorOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.secondary}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Custom Byline
                        </label>
                        <input
                          value={authorName}
                          onChange={(event) => setAuthorName(event.target.value)}
                          className={composerFieldClassName}
                        />
                        <div className="mt-1 text-right text-xs font-medium text-slate-400">
                          {authorNameWordCountLabel}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Slug
                        </label>
                        <input
                          ref={slugInputRef}
                          value={slug}
                          onChange={(event) => setSlug(event.target.value)}
                          placeholder="optional-custom-slug"
                          className={composerFieldClassName}
                        />
                      </div>

                      <div className="border border-slate-200 bg-slate-50 px-2 py-3 text-sm text-slate-600 md:px-4">
                        {editorPermalinkDisplay}
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Post Flags
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 px-2 py-4 md:px-4">
                      {[
                        {
                          key: "featured",
                          label: "Featured",
                          active: featured,
                          onClick: () => setFeatured((prev) => !prev),
                        },
                        {
                          key: "trending",
                          label: "Trending",
                          active: trending,
                          onClick: () => setTrending((prev) => !prev),
                        },
                        {
                          key: "pinned",
                          label: "Pinned",
                          active: pinned,
                          onClick: () => setPinned((prev) => !prev),
                        },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={item.onClick}
                          className={`inline-flex items-center border px-3 py-2 text-xs font-semibold transition ${
                            item.active
                              ? "border-[#CFC3FF] bg-[#F3EEFF] text-[#5B34E6]"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Starter Layouts
                      </h3>
                    </div>
                    <div className="space-y-2 px-2 py-4 md:px-4">
                      {editorTemplateActions.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={item.onClick}
                          className="flex w-full items-start justify-between border border-slate-200 bg-white px-2 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 md:px-4"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {item.label}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-slate-500">
                              {item.description}
                            </div>
                          </div>
                          <FaPlus className="mt-1 text-xs text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-2 py-4 md:px-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Product Facts
                      </h3>
                    </div>
                    <div className="px-2 py-4 md:px-4">
                      <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                        {blogMode !== "product" ? (
                          <span className="text-sm text-slate-400">
                            Switch to a product-linked story to use dynamic facts.
                          </span>
                        ) : tokenKeys.length === 0 ? (
                          <span className="text-sm text-slate-400">
                            No product facts available
                          </span>
                        ) : (
                          tokenKeys.map((tokenKey) => (
                            <button
                              key={tokenKey}
                              type="button"
                              onPointerDown={(event) =>
                                handleToolbarAction(
                                  event,
                                  () => insertToken(tokenKey),
                                )
                              }
                              className="border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                            >
                              {`{{${tokenKey}}}`}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      </div>
      {linkDialogOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="mx-auto w-full max-w-lg overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitLinkDialog();
              }}
            >
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Content Link
                </div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  Add or edit a link
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Link URL
                  </label>
                  <input
                    ref={linkUrlInputRef}
                    value={linkDialogUrl}
                    onChange={(event) => {
                      setLinkDialogUrl(event.target.value);
                      if (linkDialogError) setLinkDialogError("");
                    }}
                    placeholder="https://example.com"
                    className={composerFieldClassName}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Link Text
                  </label>
                  <input
                    value={linkDialogText}
                    onChange={(event) => setLinkDialogText(event.target.value)}
                    placeholder="Optional. Leave blank to use selected text or the URL."
                    className={composerFieldClassName}
                  />
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    This opens inline in the editor now, so mobile users do not
                    get a browser alert prompt.
                  </div>
                </div>

                {linkDialogError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {linkDialogError}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeLinkDialog}
                  className={`${composerButtonClassName} h-11 px-4`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${composerButtonClassName} h-11 px-4`}
                >
                  Apply Link
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {composerPreviewOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Preview
                </div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  Article preview
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComposerPreviewOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-8 md:py-8">
              <div className="mx-auto max-w-4xl">
                <h2 className="text-[2.35rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
                  {title || "Your post title will appear here"}
                </h2>

                {excerpt ? (
                  <p className="mt-4 text-lg leading-8 text-slate-600">
                    {excerpt}
                  </p>
                ) : null}

                <div
                  className="mt-8 space-y-4 text-[17px] leading-8 text-slate-800 [&_a]:font-semibold [&_a]:text-[#4F46E5] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#6B2EFF] [&_blockquote]:pl-4 [&_h2]:mt-8 [&_h2]:text-[30px] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h3]:mt-6 [&_h3]:text-[24px] [&_h3]:font-semibold [&_img]:my-6 [&_img]:rounded-3xl [&_img]:shadow-sm [&_ol]:pl-6 [&_ol]:list-decimal [&_p]:my-4 [&_ul]:pl-6 [&_ul]:list-disc"
                  dangerouslySetInnerHTML={{
                    __html:
                      articlePreviewHtml ||
                      "<p>Start writing in the editor to preview the story here.</p>",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BlogEditor;







