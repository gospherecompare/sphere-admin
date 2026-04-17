import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowRight, FaBuilding, FaMobileAlt, FaSearch, FaSpinner } from "react-icons/fa";
import { buildUrl, getAuthToken } from "../api";
import { getSearchNavigationTarget } from "../utils/searchNavigation";

const formatProductType = (value) => {
  if (!value) return "Product";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const GlobalSearchResults = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    if (!query) {
      setResults([]);
      setLoading(false);
      setError("");
      return () => controller.abort();
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");
        const token = getAuthToken();
        const response = await fetch(
          buildUrl(`/api/search/admin?q=${encodeURIComponent(query)}`),
          {
            signal: controller.signal,
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          },
        );
        if (!response.ok) {
          throw new Error(`Search failed (${response.status})`);
        }

        const data = await response.json();
        const nextResults = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
            ? data
            : [];
        setResults(nextResults);
      } catch (err) {
        if (err.name === "AbortError") return;
        setResults([]);
        setError(err.message || "Unable to fetch search results");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResults();
    return () => controller.abort();
  }, [query]);

  const { productResults, brandResults } = useMemo(() => {
    const products = results.filter((item) => item?.type === "product");
    const brands = results.filter((item) => item?.type === "brand");
    return {
      productResults: products,
      brandResults: brands,
    };
  }, [results]);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const nextQuery = inputValue.trim();
      if (!nextQuery) {
        setSearchParams({});
        return;
      }
      setSearchParams({ q: nextQuery });
    },
    [inputValue, setSearchParams],
  );

  const openResult = useCallback(
    (item) => {
      const target = getSearchNavigationTarget(item, query);
      navigate(target.path, target.state ? { state: target.state } : undefined);
    },
    [navigate, query],
  );

  return (
    <div className="page-stack">
      <div className="surface-panel rounded-[24px] p-4 sm:p-5">
        <p className="page-kicker">Global Search</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Search Results
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Search across products and brands from the admin workspace.
        </p>
        <form onSubmit={handleSearchSubmit} className="mt-4">
          <div className="relative w-full md:max-w-lg">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search products or brands"
              className="w-full rounded-2xl border border-slate-200 bg-white/85 py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </div>
        </form>
      </div>

      {!query && (
        <div className="surface-panel rounded-[24px] p-8 text-center text-slate-500">
          Enter a keyword to find products and brands.
        </div>
      )}

      {query && loading && (
        <div className="surface-panel rounded-[24px] p-8 text-center text-slate-500">
          <FaSpinner className="mx-auto animate-spin text-lg text-slate-400" />
          <p className="mt-2 text-sm">Searching for "{query}"...</p>
        </div>
      )}

      {query && !loading && error && (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {query && !loading && !error && results.length === 0 && (
        <div className="surface-panel rounded-[24px] p-8 text-center text-slate-500">
          No results found for "{query}".
        </div>
      )}

      {query && !loading && !error && results.length > 0 && (
        <div className="space-y-5">
          {productResults.length > 0 && (
            <section className="surface-panel rounded-[24px] p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Products ({productResults.length})
              </h2>
              <div className="space-y-2">
                {productResults.map((item) => (
                  <button
                    key={`product-${item.id}`}
                    type="button"
                    onClick={() => openResult(item)}
                    className="group w-full rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-left transition hover:border-sky-300 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FaMobileAlt className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {item.brand_name || "Unknown brand"} |{" "}
                          {formatProductType(item.product_type)}
                        </p>
                      </div>
                      <FaArrowRight className="flex-shrink-0 text-xs text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {brandResults.length > 0 && (
            <section className="surface-panel rounded-[24px] p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Brands ({brandResults.length})
              </h2>
              <div className="space-y-2">
                {brandResults.map((item) => (
                  <button
                    key={`brand-${item.id}`}
                    type="button"
                    onClick={() => openResult(item)}
                    className="group w-full rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-left transition hover:border-sky-300 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200">
                        <FaBuilding className="text-sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Open brand management
                        </p>
                      </div>
                      <FaArrowRight className="flex-shrink-0 text-xs text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchResults;
