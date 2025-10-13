import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Card from "./card";
import type { ChineseWord } from "@/lib/card-utils";
import {speakChinese, renderPinyinWithCharacters} from "./new-card-modal";
import { Languages, Volume2, Eye, EyeOff } from "lucide-react";
type CardType = any;

type Props = {
    cards: ChineseWord[];  // ✅ plural, array
    index: number;
    onCardClick: (c: ChineseWord) => void;
    autoReveal?: boolean;
    revealDelay?: number;
    renderDetails?: (card: ChineseWord) => React.ReactNode;
};

export default function CardWithDetails({
    cards,
    index,
    onCardClick,
    autoReveal = true,
    revealDelay = 2000,
    renderDetails,
    }: Props) {
        const [expanded, setExpanded] = useState(false);
        const [translatedIndex, setTranslatedIndex] = useState<number | null>(null);
        const [translatedText, setTranslatedText] = useState("");
        const [pinyinVisibility, setPinyinVisibility] = useState<{ [key: number]: boolean }>({});
        const togglePinyin = (index: number) => {
        setPinyinVisibility((prev) => ({
            ...prev,
            [index]: !prev[index], // toggle only this example
        }));
    };
    useEffect(() => {
        // Reset translation and pinyin visibility when card changes
        setTranslatedIndex(null);
        setTranslatedText("");
        setPinyinVisibility({});
    }, [index]);


    useEffect(() => {
        setExpanded(false);
        if (!autoReveal) return;
        const t = setTimeout(() => setExpanded(true), revealDelay);
        return () => clearTimeout(t);
    }, [index, autoReveal, revealDelay]);

    // ✅ Now this works fine
    const current = cards[index];

    useEffect(() => {
        setExpanded(false);
        if (!autoReveal) return;
        const t = setTimeout(() => setExpanded(true), revealDelay);
        return () => clearTimeout(t);
    }, [index, autoReveal, revealDelay]);

    const cardMaxWidthStyle = expanded
        ? { maxWidth: `calc(30vw)` } // fixed to 30% of viewport width
        : { maxWidth: "30vw" };
    
        const examples = typeof current.Examples === "string" && current.Examples.trim().length > 0
        ? current.Examples.split(/\d+\.\s*/).filter(Boolean)
        : [];
    const translateChineseToEnglish = async (text: string) => {
        try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const result = await response.json();
        return result[0][0][0];
        } catch (error) {
        return "Translation failed";
        }
    };
    return (
        <div className="w-full flex justify-center items-center h-[50vh]">
            <div className="relative flex items-stretch justify-center w-full max-w-6xl h-full">
            {/* Card Section */}
            <motion.div
                className="flex items-center justify-center transition-all px-4"
                animate={{
                    flexBasis: expanded ? "65%" : "100%", // use flexBasis instead of width
                }}
                transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 20,
                    duration: 0.6,
                }}
                >
                <AnimatePresence mode="wait">
                    <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center"
                    >
                    <div style={cardMaxWidthStyle}>
                        <Card
                        card={current}
                        showAnimation
                        size="xl"
                        onClick={() => onCardClick(current)}
                        />
                    </div>
                    </motion.div>
                </AnimatePresence>
                </motion.div>

                {/* Detail Section */}
                <motion.div
                className="relative h-full overflow-hidden"
                initial={false}
                animate={{
                    flexBasis: expanded ? "80%" : "0%",
                    opacity: expanded ? 1 : 0,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                <AnimatePresence initial={false}>
                    {expanded && (
                        <div
                            key={`detail-${index}`}
                            className="h-full overflow-auto transition-none"
                            style={{ width: "100%" }}
                        >
                            <div className="p-4">
                            {renderDetails ? (
                                renderDetails(current)
                            ) : (
                                <div>
                                <p className="text-sm text-gray-500 truncate">
                                    {current?.Pinyin ?? "Untitled"}
                                </p>
                                <h3 className="flex text-lg font-semibold truncate font-Winchinese">
                                    {current?.Chinese ?? "Untitled"}
                                {/* Speak Button */}
                                <button
                                    onClick={() => speakChinese(current?.Chinese)}
                                    className="flex items-center justify-center px-3 py-1 text-base hover:text-accent transition-colors"
                                    title="Speak"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                                </h3>
                                {current?.Translation && (
                                    <p className="text-sm text-gray-700 truncate">
                                    {current.Translation}
                                    </p>
                                )}
                                <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap text-justify">
                                    {current?.Meaning ? (
                                    <p>{current.Meaning}</p>
                                    ) : (
                                    <p className="text-gray-400">No description available.</p>
                                    )}
                                </div>
                                {examples.length > 0 &&
                                    examples.map((rawExample, index) => {
                                        const example = (rawExample ?? "").trim();
                                        const isPinyinVisible = pinyinVisibility[index] ?? true; // default: show pinyin

                                        return (
                                            <div key={index} className="flex flex-col py-4 gap-0">
                                                {/* Action Row */}
                                                <div className="flex items-center gap-2 leading-relaxed ">
                                                
                                                {/* Translate Button */}
                                                <button
                                                    onClick={async () => {
                                                    const result = await translateChineseToEnglish(example);
                                                    setTranslatedIndex(index);
                                                    setTranslatedText(result);
                                                    }}
                                                    className="flex items-center justify-center px-0 py-1 text-base hover:text-accent transition-colors"
                                                    data-testid={`translate-example-${index}`}
                                                    title="Translate"
                                                >
                                                    <Languages className="w-4 h-4" />
                                                </button>

                                                {/* Speak Button */}
                                                <button
                                                    onClick={() => speakChinese(example)}
                                                    className="flex items-center justify-center px-0 py-1 text-base hover:text-accent transition-colors"
                                                    data-testid={`speak-example-${index}`}
                                                    title="Speak"
                                                >
                                                    <Volume2 className="w-4 h-4" />
                                                </button>

                                                {/* Pinyin Toggle Button */}
                                                <button
                                                    onClick={() => togglePinyin(index)}
                                                    className="flex items-center justify-center px-0 py-1 text-base hover:text-accent transition-colors"
                                                    title={isPinyinVisible ? "Hide Pinyin" : "Show Pinyin"}
                                                    data-testid={`pinyin-toggle-${index}`}
                                                >
                                                    {isPinyinVisible ? (
                                                    <Eye className="w-4 h-4" />
                                                    ) : (
                                                    <EyeOff className="w-4 h-4" />
                                                    )}
                                                </button>

                                                {/* Example + Translation container */}
                                                <div className="flex flex-col">
                                                {/* Example text */}
                                                <div className="text-base text-gray-600">
                                                    <pre className="whitespace-pre-wrap leading-relaxed font-Winchinese">
                                                    {isPinyinVisible ? example : renderPinyinWithCharacters(example)}
                                                    </pre>
                                                </div>

                                                {/* Translation text */}
                                                {translatedIndex === index && translatedText && (
                                                    <div className="pl-3 border-l-2 border-accent text-sm text-gray-700 italic">
                                                    {translatedText}
                                                    </div>
                                                )}
                                                </div>
                                            </div>
                                            </div>
                                            );

                                    })}
                                </div>
                            )}
                            </div>
                        </div>
                    )}

                </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
