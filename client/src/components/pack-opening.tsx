import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllWords,
  searchWords,
  getRandomWords,
  getImageUrl,
  loadCollectionFromLocalStorage,
  addCardToLocalCollection,
  removeCardFromLocalCollection,
  isCardInLocalCollection,
  ChineseWord,
} from "@/lib/card-utils";

/**
 * This component replaces CSV fetches with Supabase-backed queries
 * (via helpers in card-utils.ts). It keeps localStorage-based collection
 * behavior and provides simple search / filter / sorting UI hooks.
 *
 * Note: This file focuses on data fetching + collection logic. Drop it in place of your original
 * pack-opening component; it uses your existing helpers and env names.
 */

export default function PackOpening() {
  // UI state (search, filters, sorting)
  const [q, setQ] = useState("");
  const [hskFilter, setHskFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"frequency" | "hsk" | "id">("id");

  // local collection (unlocked cards) - warm from localStorage
  const [localCollection, setLocalCollection] = useState<ChineseWord[]>(
    () => loadCollectionFromLocalStorage()
  );

  // Query: load all words (used as baseline)
  const allWordsQuery = useQuery({
    queryKey: ["words", "all"],
    queryFn: fetchAllWords,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  // Query: search (only run when q provided)
  const searchQuery = useQuery({
    queryKey: ["words", "search", q],
    queryFn: () => searchWords(q, 200),
    enabled: q.trim() !== "",
  });

  // Expose displayed list (search takes precedence)
  const baseList = useMemo(() => {
    if (searchQuery.data && q.trim() !== "") return searchQuery.data;
    if (allWordsQuery.data) return allWordsQuery.data;
    return [];
  }, [allWordsQuery.data, searchQuery.data, q]);

  // Apply filters & sorting
  const displayed = useMemo(() => {
    let out = baseList.slice();
    if (hskFilter != null) {
      out = out.filter((w) => {
        if (!w.HSK) return false;
        const level = Number(w.HSK);
        return Number.isFinite(level) ? level === hskFilter : false;
      });
    }
    if (sortBy === "frequency") {
      out.sort((a, b) => (b.Frequency ?? 0) - (a.Frequency ?? 0));
    } else if (sortBy === "hsk") {
      out.sort(
        (a, b) =>
          (Number(a.HSK ?? "999") as number) - (Number(b.HSK ?? "999") as number)
      );
    } else {
      out.sort((a, b) => Number(a.Id ?? a.id ?? 0) - Number(b.Id ?? b.id ?? 0));
    }
    return out;
  }, [baseList, hskFilter, sortBy]);

  // Helpers for unlocking/locking (local collection)
  function handleAddToCollection(card: ChineseWord) {
    const next = addCardToLocalCollection(card);
    setLocalCollection(next);
  }
  function handleRemoveFromCollection(cardId: string) {
    const next = removeCardFromLocalCollection(cardId);
    setLocalCollection(next);
  }
  function isUnlocked(cardId: string) {
    return isCardInLocalCollection(cardId);
  }

  // Basic UI — keep lightweight: search input, filters, list with image and lock/unlock button
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Cards (Supabase)</h2>

      <div className="flex gap-2 mb-4">
        <input
          aria-label="Search"
          placeholder="Search Chinese / Pinyin / Translation..."
          className="border p-2 rounded flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={hskFilter ?? ""}
          onChange={(e) =>
            setHskFilter(e.target.value ? Number(e.target.value) : null)
          }
          className="border p-2 rounded"
        >
          <option value="">All HSK</option>
          <option value="1">HSK 1</option>
          <option value="2">HSK 2</option>
          <option value="3">HSK 3</option>
          <option value="4">HSK 4</option>
          <option value="5">HSK 5</option>
          <option value="6">HSK 6</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "frequency" | "hsk" | "id")
          }
          className="border p-2 rounded"
        >
          <option value="id">Sort by Id</option>
          <option value="frequency">Sort by Frequency</option>
          <option value="hsk">Sort by HSK</option>
        </select>
      </div>

      <div className="mb-4">
        <strong>Progress:</strong>{" "}
        {localCollection.length} unlocked / {displayed.length} shown
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allWordsQuery.isLoading && <div>Loading cards…</div>}
        {allWordsQuery.isError && (
          <div className="text-red-600">Error: {(allWordsQuery.error as any)?.message}</div>
        )}

        {displayed.map((card) => {
          const unlocked = isUnlocked(card.id);
          const imgSrc = card.Image ? card.Image : getImageUrl({ id: card.id });
          return (
            <div
              key={card.id}
              className="border rounded p-2 flex flex-col items-center text-center"
              data-testid={`card-${card.id}`}
            >
              <div className="w-full aspect-[3/4] mb-2 bg-gray-100">
                {/* Image: use your API_BASE /Images/{id}.webp if Image empty */}
                <img
                  src={imgSrc}
                  alt={card.Chinese ?? card.Translation ?? card.id}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // fallback placeholder
                    (e.target as HTMLImageElement).src =
                      "/Images/placeholder.webp";
                  }}
                />
              </div>

              <div className="text-lg font-semibold">{card.Chinese}</div>
              <div className="text-sm">{card.Pinyin}</div>
              <div className="text-sm opacity-80">{card.Translation}</div>
              <div className="mt-2 flex gap-2">
                {!unlocked ? (
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white"
                    onClick={() => handleAddToCollection(card)}
                    data-testid={`unlock-btn-${card.id}`}
                  >
                    Unlock
                  </button>
                ) : (
                  <button
                    className="px-3 py-1 rounded bg-gray-300"
                    onClick={() => handleRemoveFromCollection(card.id)}
                    data-testid={`lock-btn-${card.id}`}
                  >
                    Lock
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
