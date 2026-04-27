import { useCallback, useEffect, useRef, useState } from "react";
import { CarCapacity, CarTypes } from "../../../constants";
import Card from "../../components/Card";
import { useLocation, useNavigate } from "react-router-dom";
import { asyncGetAllCars } from "../../store/actions/carActions";
import { useDispatch, useSelector } from "react-redux";
import { notifyError } from "../../utils/Toast";
import Pagination from "../../components/Pagination";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
];

const Cars = () => {
  const [type, setType] = useState(() => CarTypes.map(() => false));
  const [capacity, setCapacity] = useState(() => CarCapacity.map(() => false));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sortRef = useRef(null);

  const { allCars } = useSelector((state) => state.app);

  const { pathname, search: locationSearch } = useLocation();
  const searchParams = new URLSearchParams(locationSearch);
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const buildQuery = useCallback(() => {
    const filteredTypes = CarTypes.filter((_, i) => type[i]);
    const filteredCapacities = CarCapacity.filter((_, i) => capacity[i]);

    let q = `page=${page}`;
    if (filteredTypes.length > 0) q += `&type=${filteredTypes.join(",")}`;
    if (filteredCapacities.length > 0) q += `&capacities=${filteredCapacities.join(",")}`;
    if (debouncedSearch) q += `&search=${encodeURIComponent(debouncedSearch)}`;
    if (minPrice) q += `&minPrice=${minPrice}`;
    if (maxPrice) q += `&maxPrice=${maxPrice}`;
    if (sort !== "newest") q += `&sort=${sort}`;
    return q;
  }, [type, capacity, debouncedSearch, minPrice, maxPrice, sort, page]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const query = buildQuery();
    navigate(`${pathname}?${query}`, { replace: true });
    dispatch(asyncGetAllCars(query)).then((res) => {
      if (res !== 200) notifyError("Failed to fetch cars");
    });
  }, [type, capacity, debouncedSearch, minPrice, maxPrice, sort, page]); // intentional: navigate/dispatch/pathname are stable refs

  const handleTypeCheckbox = (index) => {
    setType((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
    setPage(1);
  };

  const handleCapacityCheckbox = (index) => {
    setCapacity((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
    setPage(1);
  };

  const clearAllFilters = () => {
    setType(CarTypes.map(() => false));
    setCapacity(CarCapacity.map(() => false));
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  };

  const activeFilterCount =
    type.filter(Boolean).length +
    capacity.filter(Boolean).length +
    (search ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0);

  const FilterPanel = () => (
    <div className="flex flex-col gap-4">
      {/* Type */}
      <div className="pb-4 border-b border-gray-200">
        <span className="font-semibold text-base text-gray-800 block mb-3">Type</span>
        {CarTypes.map((val, index) => (
          <label
            key={index}
            className="flex items-center gap-2 mb-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <input
              type="checkbox"
              onChange={() => handleTypeCheckbox(index)}
              checked={type[index]}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
            />
            {val}
          </label>
        ))}
      </div>

      {/* Capacity */}
      <div className="pb-4 border-b border-gray-200">
        <span className="font-semibold text-base text-gray-800 block mb-3">Capacity</span>
        {CarCapacity.map((val, index) => (
          <label
            key={index}
            className="flex items-center gap-2 mb-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <input
              type="checkbox"
              onChange={() => handleCapacityCheckbox(index)}
              checked={capacity[index]}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
            />
            {val}
          </label>
        ))}
      </div>

      {/* Price Range */}
      <div>
        <span className="font-semibold text-base text-gray-800 block mb-3">Price Range</span>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Min (₹)</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              placeholder="0"
              min="0"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Max (₹)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              placeholder="Any"
              min="0"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="mt-2 w-full py-2 text-sm text-red-500 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <div className="container px-3 sm:px-4 mb-20 mt-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h1 className="text-2xl md:text-[32px] font-semibold text-gray-900">
            Most Popular Cars
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search bar */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search cars..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-400 transition-colors bg-white"
              >
                {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                <ChevronDown size={14} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false); setPage(1); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${sort === opt.value ? "text-blue-600 font-medium" : "text-gray-700"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-400 transition-colors bg-white"
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-5">
          {/* Desktop filter sidebar */}
          <div className="hidden md:block sticky top-20 w-52 shrink-0 border border-gray-200 rounded-xl px-4 py-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-800">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5 font-medium">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <FilterPanel />
          </div>

          {/* Car grid */}
          <div className="flex-1 flex flex-col gap-5">
            {allCars?.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-lg font-medium">No cars found</p>
                <p className="text-sm mt-1">Try adjusting your filters or search term</p>
                <button onClick={clearAllFilters} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {allCars?.map((car, index) => {
                  if (car.sold) return null;
                  return <Card key={car._id || index} car={car} />;
                })}
              </div>
            )}

            <Pagination
              page={page}
              setPage={setPage}
              items={allCars?.length ?? 0}
              showItems={20}
            />
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-72 max-w-[90vw] h-full bg-white shadow-2xl overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <span className="font-semibold text-lg">Filters</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="mt-5 w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Show Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cars;
