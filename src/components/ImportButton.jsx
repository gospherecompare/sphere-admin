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
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
          Global Search
        </p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Search Results</h1>
        <form onSubmit={handleSearchSubmit} className="mt-4">
          <div className="relative w-full md:max-w-lg">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search products or brands"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>

      {!query && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
          Enter a keyword to find products and brands.
        </div>
      )}

      {query && loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          <FaSpinner className="animate-spin mx-auto text-lg" />
          <p className="mt-2 text-sm">Searching for "{query}"...</p>
        </div>
      )}

      {query && !loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {query && !loading && !error && results.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          No results found for "{query}".
        </div>
      )}

      {query && !loading && !error && results.length > 0 && (
        <div className="space-y-5">
          {productResults.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Products ({productResults.length})
              </h2>
              <div className="space-y-2">
                {productResults.map((item) => (
                  <button
                    key={`product-${item.id}`}
                    type="button"
                    onClick={() => openResult(item)}
                    className="w-full text-left border border-gray-200 hover:border-blue-300 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaMobileAlt className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {item.brand_name || "Unknown brand"} |{" "}
                          {formatProductType(item.product_type)}
                        </p>
                      </div>
                      <FaArrowRight className="text-gray-400 text-xs flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {brandResults.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Brands ({brandResults.length})
              </h2>
              <div className="space-y-2">
                {brandResults.map((item) => (
                  <button
                    key={`brand-${item.id}`}
                    type="button"
                    onClick={() => openResult(item)}
                    className="w-full text-left border border-gray-200 hover:border-blue-300 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                        <FaBuilding className="text-sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Open brand management
                        </p>
                      </div>
                      <FaArrowRight className="text-gray-400 text-xs flex-shrink-0" />
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

