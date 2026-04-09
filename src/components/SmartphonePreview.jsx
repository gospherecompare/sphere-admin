import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FaBoxOpen,
  FaCamera,
  FaCheckCircle,
  FaChevronRight,
  FaExclamationCircle,
  FaEye,
  FaImage,
  FaInfoCircle,
  FaLink,
  FaMobile,
  FaPalette,
  FaPercent,
  FaTag,
} from "react-icons/fa";
import {
  getSmartphonePreviewLaunchStatus,
  readSmartphonePreviewState,
} from "../utils/smartphonePreview";

const SPEC_SECTIONS = [
  ["build_design", "Build & Design", FaMobile],
  ["display", "Display", FaEye],
  ["performance", "Performance", FaBoxOpen],
  ["camera", "Camera", FaCamera],
  ["battery", "Battery", FaBoxOpen],
  ["connectivity", "Connectivity", FaLink],
  ["network", "Network", FaTag],
  ["ports", "Ports", FaLink],
  ["audio", "Audio", FaBoxOpen],
  ["multimedia", "Multimedia", FaImage],
];

const STATUS_STYLES = {
  upcoming: "bg-amber-100 text-amber-800 border-amber-200",
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  released: "bg-sky-100 text-sky-800 border-sky-200",
  rumored: "bg-slate-100 text-slate-800 border-slate-200",
  announced: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const isFilled = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some(isFilled);
  if (typeof value === "object") return Object.values(value).some(isFilled);
  return String(value).trim() !== "";
};

const toTitle = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b5g\b/gi, "5G")
    .replace(/\besim\b/gi, "eSIM")
    .replace(/\bwifi\b/gi, "Wi-Fi")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
};

const formatCurrency = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? `INR ${num.toLocaleString("en-IN")}` : String(value || "");
};

const getImageSrc = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (typeof image === "object") return image.secure_url || image.url || image.src || "";
  return String(image);
};

const Field = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </div>
    <div className="mt-2 text-sm font-medium text-slate-900 break-words">
      {isFilled(value) ? value : "No data"}
    </div>
  </div>
);

const Section = ({ title, icon: Icon, children, subtitle }) => (
  <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Icon className="text-base" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

function SmartphonePreview() {
  const location = useLocation();
  const params = useParams();
  const routeState =
    location.state && typeof location.state === "object"
      ? location.state.previewState
      : null;
  const storedState = readSmartphonePreviewState();
  const previewState = routeState || storedState;

  if (!previewState) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <FaExclamationCircle className="text-2xl" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-slate-900">
            Smartphone preview not found
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The preview snapshot is missing or expired. Go back to the create
            form and open Preview again to generate a fresh snapshot.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/products/smartphones/create"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <FaChevronRight className="rotate-180 text-xs" />
              Back to editor
            </Link>
            <Link
              to="/products/smartphones/inventory"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Inventory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formData = previewState.formData || {};
  const product = formData.product || {};
  const smartphone = formData.smartphone || {};
  const images = (Array.isArray(formData.images) ? formData.images : [])
    .map(getImageSrc)
    .filter(Boolean);
  const variants = Array.isArray(formData.variants) ? formData.variants : [];
  const colors = Array.isArray(smartphone.colors) ? smartphone.colors : [];
  const launchStatus =
    previewState.launchStatus || getSmartphonePreviewLaunchStatus(formData) || "released";
  const statusStyle = STATUS_STYLES[launchStatus] || STATUS_STYLES.released;
  const title =
    previewState.title ||
    product.name ||
    smartphone.model ||
    smartphone.brand ||
    "Smartphone preview";
  const storeCount = variants.reduce(
    (count, variant) => count + (Array.isArray(variant.stores) ? variant.stores.length : 0),
    0,
  );
  const heroImage = images[0];
  const quickFacts = [
    ["Product name", product.name || "No name set"],
    ["Brand", smartphone.brand || "No brand set"],
    ["Model", smartphone.model || "No model set"],
    ["Launch date", smartphone.launch_date ? formatDate(smartphone.launch_date) : "Not set"],
    ["Publish mode", previewState.publishEnabled ? "Will publish on save" : "Saved as draft"],
    ["Preview slug", previewState.slug || params.slug || "smartphone-preview"],
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50">
      <div className="border-b border-slate-900/5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                <FaMobile className="text-xs" />
                Smartphone Preview
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl break-words">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Review the draft before publishing. This page reflects the saved
                snapshot from the create form.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}>
                  {toTitle(launchStatus)}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                  {previewState.publishEnabled ? "Publish enabled" : "Draft preview"}
                </span>
                {previewState.savedAt ? (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                    Saved {formatDate(previewState.savedAt)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products/smartphones/create"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/10 hover:-translate-y-0.5"
              >
                <FaChevronRight className="rotate-180 text-xs" />
                Back to editor
              </Link>
              <Link
                to="/products/smartphones/inventory"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Inventory
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Images" value={`${images.length} uploaded`} />
              <Field label="Variants" value={`${variants.length} configured`} />
              <Field label="Colors" value={`${colors.filter((color) => isFilled(color?.name) || isFilled(color?.code)).length} added`} />
              <Field label="Stores" value={`${storeCount} mapped`} />
            </div>

            <Section
              title="Hero preview"
              icon={FaEye}
              subtitle="The primary product card for this smartphone."
            >
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {heroImage ? (
                      <img src={heroImage} alt={title} className="h-72 w-full object-cover sm:h-80" />
                    ) : (
                      <div className="flex h-72 items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-400 sm:h-80">
                        <div className="text-center">
                          <FaImage className="mx-auto text-4xl" />
                          <p className="mt-3 text-sm font-medium">No hero image available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {images.length > 1 ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
                      {images.slice(0, 8).map((src, index) => (
                        <div key={`${src}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <img src={src} alt={`${title} thumbnail ${index + 1}`} className="h-20 w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Key facts
                    </div>
                    <div className="mt-4 space-y-3">
                      {quickFacts.map(([label, value]) => (
                        <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-3 last:border-b-0 last:pb-0">
                          <div className="text-sm text-slate-500">{label}</div>
                          <div className="max-w-[60%] text-right text-sm font-medium text-slate-900 break-words">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Colors
                    </div>
                    <div className="mt-4 space-y-3">
                      {colors.length > 0 ? (
                        colors.map((color, index) => {
                          const name = color?.name || `Color ${index + 1}`;
                          const code = color?.code || "#cbd5e1";
                          return (
                            <div key={`${name}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                              <span className="h-10 w-10 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: code }} />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-slate-900">{name}</div>
                                <div className="text-xs text-slate-500">{code}</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                          No colors were added.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section
              title="Variants and stores"
              icon={FaBoxOpen}
              subtitle="Storage combinations, prices, and store-level offers."
            >
              <div className="space-y-4">
                {variants.length > 0 ? (
                  variants.map((variant, index) => {
                    const stores = Array.isArray(variant.stores) ? variant.stores : [];
                    return (
                      <div key={`${variant.ram || "variant"}-${variant.storage || "storage"}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              Variant #{index + 1}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {variant.ram || "RAM not set"}
                              {variant.storage ? ` / ${variant.storage}` : ""}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                              RAM {variant.ram || "N/A"}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                              Storage {variant.storage || "N/A"}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                              {variant.base_price ? formatCurrency(variant.base_price) : "No base price"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {stores.length > 0 ? (
                            stores.map((store, storeIndex) => (
                              <div key={`${store.store_name || "store"}-${storeIndex}`} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">
                                      {store.store_name || `Store ${storeIndex + 1}`}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {store.sale_start_date ? `Sale starts ${formatDate(store.sale_start_date)}` : "No sale start date set"}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {isFilled(store.price) ? (
                                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {formatCurrency(store.price)}
                                      </span>
                                    ) : null}
                                    {isFilled(store.discount) ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                                        <FaPercent className="text-[10px]" />
                                        {store.discount}%
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                  {isFilled(store.offers) ? (
                                    <div className="rounded-lg bg-slate-50 p-3">
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Offers</div>
                                      <div className="mt-1 text-sm text-slate-800">{store.offers}</div>
                                    </div>
                                  ) : null}
                                  {isFilled(store.offer_text) ? (
                                    <div className="rounded-lg bg-slate-50 p-3">
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Offer text</div>
                                      <div className="mt-1 text-sm text-slate-800">{store.offer_text}</div>
                                    </div>
                                  ) : null}
                                  {isFilled(store.url) ? (
                                    <div className="rounded-lg bg-slate-50 p-3">
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Affiliate URL</div>
                                      <a href={store.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-sky-700 hover:underline">
                                        {store.url}
                                      </a>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                              No stores are attached to this variant yet.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No variants have been configured yet.
                  </div>
                )}
              </div>
            </Section>

            <Section
              title="Technical specifications"
              icon={FaInfoCircle}
              subtitle="Raw section snapshots from the form."
            >
              <div className="space-y-4">
                {SPEC_SECTIONS.map(([key, label, Icon]) => {
                  const value = smartphone[key];
                  if (!isFilled(value)) return null;
                  return (
                    <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                          <Icon className="text-sm" />
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{label}</div>
                      </div>
                      <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  );
                })}

                {!SPEC_SECTIONS.some(([key]) => isFilled(smartphone[key])) ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No technical specifications were entered yet.
                  </div>
                ) : null}
              </div>
            </Section>
          </div>

          <aside className="space-y-6">
            <Section title="Snapshot details" icon={FaInfoCircle} subtitle="Metadata that describes this preview state.">
              <div className="space-y-3">
                <Field label="Preview title" value={title} />
                <Field label="Preview slug" value={previewState.slug || params.slug || "smartphone-preview"} />
                <Field label="Publish mode" value={previewState.publishEnabled ? "Publish enabled" : "Draft preview"} />
              </div>
            </Section>

            <Section title="Product overview" icon={FaMobile} subtitle="The headline fields from the create form.">
              <div className="space-y-3">
                {quickFacts.map(([label, value]) => (
                  <Field key={label} label={label} value={value} />
                ))}
              </div>
            </Section>

            <Section title="Next step" icon={FaCheckCircle} subtitle="Use this preview to confirm the draft before submitting.">
              <p className="text-sm leading-6 text-slate-600">
                {previewState.publishEnabled
                  ? "This snapshot indicates the product will be published when saved."
                  : "This snapshot is currently marked as a draft and can still be edited before publishing."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/products/smartphones/create" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                  <FaChevronRight className="rotate-180 text-xs" />
                  Edit again
                </Link>
                <Link to="/products/smartphones/inventory" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Inventory
                </Link>
              </div>
            </Section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default SmartphonePreview;
