"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { Dropdown, Button } from "antd";
import { DownOutlined, LoadingOutlined } from "@ant-design/icons";
import { getRecipes } from "../lib/recipes";

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton" style={{ height: 14, width: "40%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 22, width: "80%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────

function RecipeCard({ recipe, index }) {
  const servingsDisplay = recipe.servings
    ? recipe.servings.toString().replace(/\s*servings?\s*$/i, "")
    : null;

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="recipe-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {recipe.coverImage ? (
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="recipe-card-image"
          loading="lazy"
        />
      ) : (
        <div className="recipe-card-image-placeholder">🍽️</div>
      )}
      <div className="recipe-card-body">
        {recipe.tags?.length > 0 && (
          <div className="recipe-card-tags">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
        <h3>{recipe.title}</h3>
        {recipe.subtitle && <p>{recipe.subtitle}</p>}
        <div className="recipe-card-footer">
          {recipe.prepTime && <span>⏱ {recipe.prepTime}</span>}
          {servingsDisplay && <span>👤 {servingsDisplay} servings</span>}
          {recipe.difficulty && <span>📊 {recipe.difficulty}</span>}
        </div>
      </div>
    </Link>
  );
}

// ─── Tags Filter ──────────────────────────────────────────────────────────────

const VISIBLE_TAG_COUNT = 2;

function TagsFilter({ allTags, activeTag, onTagChange }) {
  const visibleTags = allTags.slice(0, VISIBLE_TAG_COUNT + 1);
  const overflowTags = allTags.slice(VISIBLE_TAG_COUNT + 1);
  const overflowIsActive = overflowTags.includes(activeTag);

  const dropdownItems = overflowTags.map((tag) => ({ key: tag, label: tag }));

  return (
    <>
      {visibleTags.map((tag) => (
        <button
          key={tag}
          className={`tag-filter-btn ${activeTag === tag ? "active" : ""}`}
          onClick={() => onTagChange(tag)}
        >
          {tag}
        </button>
      ))}
      {overflowTags.length > 0 && (
        <Dropdown
          menu={{
            items: dropdownItems,
            selectedKeys: overflowIsActive ? [activeTag] : [],
            onClick: ({ key }) => onTagChange(key),
          }}
          trigger={["click"]}
        >
          <button className={`tag-filter-btn ${overflowIsActive ? "active" : ""}`}>
            {overflowIsActive ? activeTag : `+${overflowTags.length} more`}
            <DownOutlined style={{ marginLeft: 5, fontSize: 10 }} />
          </button>
        </Dropdown>
      )}
    </>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const debounceTimer = useRef(null);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    getRecipes(null)
      .then(({ recipes: data, nextCursor, hasMore }) => {
        setRecipes(data);
        setCursor(nextCursor);
        setHasMore(hasMore);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Load more ───────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { recipes: more, nextCursor, hasMore: stillMore } = await getRecipes(cursor);
      setRecipes((prev) => [...prev, ...more]);
      setCursor(nextCursor);
      setHasMore(stillMore);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore]);

  // ── Search debounce ─────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 250);
  }, []);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  // ── Tags ────────────────────────────────────────────────────────────────────
  const allTags = useMemo(() => {
    const freq = {};
    recipes.forEach((r) => r.tags?.forEach((t) => { freq[t] = (freq[t] || 0) + 1; }));
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
    return ["All", ...sorted];
  }, [recipes]);

  // ── Filter (client-side, over loaded pages) ─────────────────────────────────
  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        !debouncedSearch ||
        r.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        r.tags?.some((t) => t.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const matchesTag = activeTag === "All" || r.tags?.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [recipes, debouncedSearch, activeTag]);

  const hasFilters = debouncedSearch || activeTag !== "All";

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setActiveTag("All");
  }, []);

  const countLabel = useMemo(() => {
    if (loading) return null;
    if (hasFilters) return `${filtered.length} of ${recipes.length} recipes loaded`;
    return `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""}${hasMore ? " loaded" : ""}`;
  }, [loading, hasFilters, filtered.length, recipes.length, hasMore]);

  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1>
            Made with <em>love,</em>
            <br />
            eaten with joy.
          </h1>
          <p>A personal collection of tried-and-true recipes, from quick weeknight dinners to weekend bakes.</p>

          <div className="search-bar">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          {allTags.length > 1 && (
            <div className="tags-filter">
              <TagsFilter allTags={allTags} activeTag={activeTag} onTagChange={setActiveTag} />
              {hasFilters && (
                <button
                  className="tag-filter-btn"
                  onClick={clearFilters}
                  style={{ borderColor: "#d4863a", color: "#d4863a" }}
                >
                  ✕ Clear
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="container">
        {countLabel && !loading && (
          <p className="recipe-count">{countLabel}</p>
        )}

        {loading ? (
          <div className="loading-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h3>{hasFilters ? "No recipes found" : "No recipes yet"}</h3>
            <p>
              {hasFilters
                ? "Try a different search or tag."
                : "Head to the admin page to add your first recipe!"}
            </p>
          </div>
        ) : (
          <div className="recipe-grid">
            {filtered.map((recipe, i) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={i} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0 48px" }}>
            <Button
              onClick={handleLoadMore}
              loading={loadingMore}
              icon={loadingMore ? <LoadingOutlined /> : null}
              style={{
                borderRadius: 10,
                borderColor: "#d4863a",
                color: "#d4863a",
                fontWeight: 600,
                paddingInline: 28,
                height: 42,
              }}
            >
              {loadingMore ? "Loading…" : "Load more recipes"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}