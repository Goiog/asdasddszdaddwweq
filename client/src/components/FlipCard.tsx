import React, { useEffect, useRef, useState } from "react";
import Card, { CardBack } from "./card";

type CardData = any;

type FlipCardProps = {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  onCardChange: (newCard: CardData | null) => void;
  allCards: CardData[];
};

export default function FlipCard({ card, isOpen, onClose, onCardChange, allCards }: FlipCardProps) {
    const [flipped, setFlipped] = useState(false);
    const [viewMode, setViewMode] = useState<"flip" | "side">("flip");
    const containerRef = useRef<HTMLDivElement | null>(null);
    const touchStartX = useRef<number | null>(null);

    useEffect(() => {
        if (isOpen === false) setFlipped(false);
    }, [isOpen]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowRight") goNext();
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === " ") {
            e.preventDefault();
            setFlipped((v) => !v);
        }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, card]);

    function toggleFlip() {
        setFlipped((v) => !v);
    }

    function goNext() {
        if (!card) return;
        const idx = allCards.findIndex((c) => c === card);
        if (idx === -1) return;
        const next = allCards[(idx + 1) % allCards.length] ?? null;
        onCardChange(next);
        setFlipped(false);
    }

    function goPrev() {
        if (!card) return;
        const idx = allCards.findIndex((c) => c === card);
        if (idx === -1) return;
        const prev = allCards[(idx - 1 + allCards.length) % allCards.length] ?? null;
        onCardChange(prev);
        setFlipped(false);
    }

    const interactiveSelector =
        'button, a, input, textarea, select, [role="button"], [data-no-flip], [tabindex]:not([tabindex="-1"])';

    function handlePointerDown(e: React.PointerEvent) {
        touchStartX.current = e.clientX;
        const target = e.target as Element | null;
        (containerRef.current as any).__startedOnInteractive = !!(target && target.closest && target.closest(interactiveSelector));
        (e.target as Element).setPointerCapture(e.pointerId);
    }

    function handlePointerUp(e: React.PointerEvent) {
        if (touchStartX.current == null) return;
        const startedOnInteractive = !!(containerRef.current as any).__startedOnInteractive;
        (containerRef.current as any).__startedOnInteractive = false;
        if (startedOnInteractive) {
        touchStartX.current = null;
        return;
        }

        const dx = e.clientX - touchStartX.current;
        const threshold = 40;
        if (dx > threshold) {
        goPrev();
        } else if (dx < -threshold) {
        goNext();
        } else {
        toggleFlip();
        }
        touchStartX.current = null;
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto" style={{ alignItems: "flex-start", paddingTop: "15vh" }} aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
                <div ref={containerRef} className="relative max-w-sm w-full">
                    <div className="flex justify-center mb-3">
                        <button onClick={() => setViewMode(viewMode === "flip" ? "side" : "flip") } className="bg-white/90 hover:bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-lg shadow transition">
                            {viewMode === "flip" ? "Ver lado a lado" : "Ver FlipCard"}
                        </button>
                    </div>

                    {viewMode === "flip" ? (
                        <div
                            onPointerDown={handlePointerDown}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={() => (touchStartX.current = null)}
                            className="mx-auto w-full touch-none flex justify-center items-start"
                            style={{ perspective: 1200}}
                        >
                            {/* give this wrapper an explicit height or aspect */}
                            <div
                            className="relative w-full h-[420px] duration-500 ease-in-out transform preserve-3d rounded-2xl shadow-2xl max-w-sm"
                            style={{
                                transformStyle: "preserve-3d",
                                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                            }}
                            >
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden" style={{WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden"}}>
                                    {card ? <Card card={card} size={25} /> : <div className="flex items-center justify-center h-full bg-white/80 rounded-2xl">Sin carta</div>}
                                </div>

                                {/* Back */}
                                <div className="absolute inset-0 backface-hidden" style={{transform: "rotateY(180deg)", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden"}}>
                                    {card ? <CardBack card={card} size={25} /> : <div className="flex items-center justify-center h-full bg-white/80 rounded-2xl">Sin carta</div>}
                                </div>
                            </div>
                        </div>
                    ) : (
                // Side-by-side mode
                <div className="flex justify-center items-start gap-8 px-6 mt-2 w-full max-w-3xl mx-auto">
                        <div className="flex-1 flex justify-end">
                        {card ? <Card card={card} size={25} /> : <div className="flex items-center justify-center h-full bg-white/80 rounded-2xl">Sin carta</div>}
                        </div>
                        <div className="flex-1 flex justify-start">
                        {card ? <CardBack card={card} size={25} /> : <div className="flex items-center justify-center h-full bg-white/80 rounded-2xl">Sin carta</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
