import { 
  getImageUrl,
  type ChineseWord, type UserWord
} from "@/lib/card-utils";
import { useState, useEffect } from "react";
import { pinyinNumericToAccents } from "./pinyinUtils";
import Battery from "./Battery";
interface CardVisualProps {
  card: ChineseWord & { trained: number };
  size?: number;
}
import { SUPABASE_URL } from "@/lib/supabase";
import {speakChinese, renderPinyinWithCharacters} from "./new-card-modal";
import { Languages, Volume2, Eye, EyeOff } from "lucide-react";

export function CardVisual({ card, size=13 }: CardVisualProps) {
  const [imageError, setImageError] = useState(false);

  // safe value to display
   const rootStyle: React.CSSProperties & { [key: `--${string}`]: string } = {
    ["--card-size" as any]: `${size}rem`,
    ["--text-size" as any]: `${size * 0.0375}rem`,
    ["--chinese-size" as any]: `${size * 0.108}rem`,
    ["--id-size" as any]: `${size * 0.04}rem`,
    ["--translation-size" as any]: `${size * 0.035}rem`,
  };

  const imageUrl = getImageUrl(card, 512);

  function formatCategory(category: string): string {
    if (!category) return "";
    const formatted =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return formatted.length > 6 ? formatted.slice(0, 5) + "." : formatted;
  }

  return (
      <div
        className="aspect-[512/720] relative w-[var(--card-size)] overflow-hidden"
        style={{ 
          ...rootStyle,                     // spread your other CSS variables
          borderRadius: `${size * 0.05*0.8}rem` // add custom border radius
        }}
      >
      <div className="absolute inset-0">
        {!imageError ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br" />
        )}
      </div>

      <div className="absolute inset-0 flex flex-col h-full text-center font-sans">
        {/* HSK top-right */}
        <div
          className="absolute right-2 px-2"
          style={{ top: `${size * 0.05 * 1.4}rem`,right: `${size * 0.05 * 1.2}rem`, fontSize: `var(--text-size)` }}
        >
          HSK {card.HSK}
        </div>

        <div
          className="absolute flex flex-col"
          style={{
            gap: `${size * 0.05 * 0.4}rem`,
            top: `${size * 0.05 * 0.7}rem`,
            left: `${size * 0.05 * 0.9}rem`,
          }}
        >
          {card.Category?.split("/").map((cat: string, index: number) => (
            <div
              key={index}
              className={`badge ${cat.trim().toLowerCase()}`}
              style={{
                fontSize: `${0.7* size * 0.05}rem`,
                textTransform: "none",
                color: "#333",
              }}
            >
              {formatCategory(cat)}
            </div>
          ))}
        </div>

        {/* Pinyin: use tailwind arbitrary text utility */}
        <div className="flex flex-col items-center mt-[0.1rem] relative"
          style={{
              fontSize: "var(--text-size)",
              top: `${size * 0.05 * 0.8}rem`,
            }}>
          {card.Pinyin}
        </div>

        {/* Chinese */}
        <div className="flex flex-col items-center mt-[0.1rem] relative font-chinese">
          <div className="relative inline-block whitespace-nowrap">
            <div
              className="relative font-extrabold"
              style={{ fontSize: "var(--chinese-size)" ,
              top: `${size * 0.05 * 0.45}rem`}}
            >
              {card.Chinese}
            </div>
          </div>
        </div>

        <div className="mt-auto relative">
          <span
            className="absolute left-1/2 text-gray-700"
            style={{
              bottom: `${size * 0.05 * 0.85}rem`,
              transform: `translateX(-50%)`,
              fontSize: "var(--id-size)"
            }}
          >
            {card.Id}
          </span>
        </div>

        {/* Translation bottom-left */}
        <div
          className="absolute text-gray-700 font-sans"
          style={{
            bottom: `${size * 0.06}rem`,
            left: `${size * 0.05}rem`,
            fontSize: "var(--translation-size)"
          }}
        >
          <i> {card.Translation} </i>
        </div>

        {/* Battery bottom-right */}
        <div
          className="absolute text-gray-700"
          style={{
            bottom: `${size * 0.0475 * 1}rem`,
            right: `${size * 0.05 * 1}rem`
          }}
        >
          <Battery level={card.trained} proportion={size * 0.05 * 1.4} />
        </div>
      </div>
    </div>
  );
}


interface CardProps {
  card: ChineseWord & { trained: number };
  index:number;
  onClick?: () => void;
  showAnimation?: boolean;
  className?: string;
  size?: number;
};

// Component
export default function Card({
  card,
  onClick,
  showAnimation = false,
  className = "",
  size = 12, // 👈 Default value if not provided
}: CardProps) {
  const cardClasses = `
    relative card-3d bg-transparent rounded-[1rem] p-0 shadow-lg hover:shadow-xl 
    transition-all duration-300 cursor-pointer ${className}
    ${showAnimation ? "animate-card-reveal" : ""}
  `.trim();

  const showNewBadge = card.isNew === true && card.unlocked !== true;
  const showOwnedDuplicateBadge = card.isNew === true && card.unlocked === true;

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      data-testid={`card-${card.Id}`}
    >
      {showNewBadge && (
        <span className="absolute top-2 right-2 z-50 bg-gradient-to-r from-green-400 to-green-600 
        text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
          ✨ NEW
        </span>
      )}

      {showOwnedDuplicateBadge && (
        <span className="absolute top-2 right-2 z-50 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
          ✓ OWNED
        </span>
      )}

      <CardVisual card={card} size={size} />
    </div>
  );
}


export function CardBackVisual({ card,index, size=13 }: CardVisualProps) {
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
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
          // Reset translation and pinyin visibility when card changes
          setTranslatedIndex(null);
          setTranslatedText("");
          setPinyinVisibility({});
      }, [index]);
  // safe value to display
   const rootStyle: React.CSSProperties & { [key: `--${string}`]: string } = {
    ["--card-size" as any]: `${size}rem`,
    ["--text-size" as any]: `${size * 0.0375}rem`,
    ["--chinese-size" as any]: `${size * 0.108}rem`,
    ["--id-size" as any]: `${size * 0.04}rem`,
    ["--translation-size" as any]: `${size * 0.035}rem`,
  };

  const imageUrl = getImageUrl(card, 512);
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

  function formatCategory(category: string): string {
    if (!category) return "";
    const formatted =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return formatted.length > 6 ? formatted.slice(0, 5) + "." : formatted;
  }
  const examples = typeof card.Examples === "string" && card.Examples.trim().length > 0
        ? card.Examples.split(/\d+\.\s*/).filter(Boolean)
        : [];
  return (
      <div
        className="aspect-[512/720] relative w-[var(--card-size)] overflow-hidden"
        style={{ 
          ...rootStyle,                     // spread your other CSS variables
          borderRadius: `${size * 0.05*0.8}rem` // add custom border radius
        }}
      >
      <div className="absolute inset-0">
        {!imageError ? (
          <img
            src={`${SUPABASE_URL}/storage/v1/object/public/ChineseRequest/Card_Layout_Back.webp`}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br" />
        )}
      </div>

      <div className="absolute inset-0 flex flex-col h-full text-center font-sans text-gray-100">
        {/* HSK top-right */}
        <div
          className="absolute right-2 px-2"
          style={{ top: `${size * 0.05 * 1.4}rem`,right: `${size * 0.05 * 1.2}rem`, fontSize: `var(--text-size)` }}
        >
          HSK {card.HSK}
        </div>

        <div
          className="absolute flex flex-col"
          style={{
            gap: `${size * 0.05 * 0.4}rem`,
            top: `${size * 0.05 * 0.7}rem`,
            left: `${size * 0.05 * 0.9}rem`,
          }}
        >
          {card.Category?.split("/").map((cat: string, index: number) => (
            <div
              key={index}
              className={`badge ${cat.trim().toLowerCase()}`}
              style={{
                fontSize: `${0.7* size * 0.05}rem`,
                textTransform: "none",
                color: "#333",
              }}
            >
              <div  className="text-gray-100">
              {formatCategory(cat)}
              </div>
            </div>
          ))}
        </div>

        {/* Pinyin: use tailwind arbitrary text utility */}
        <div className="flex flex-col items-center mt-[0.1rem] relative text-gray-100"
          style={{
              fontSize: "var(--text-size)",
              top: `${size * 0.05 * 0.8}rem`,
            }}>
          {card.Pinyin}
        </div>

        {/* Chinese */}
        <div className="flex flex-col items-center mt-[0.1rem] relative font-chinese text-gray-100">
          <div className="relative inline-block whitespace-nowrap">
            <div
              className="relative font-extrabold"
              style={{ fontSize: "var(--chinese-size)" ,
              top: `${size * 0.05 * 0.45}rem`}}
            >
              {card.Chinese}
            </div>
          </div>
        </div>

        {/* Chinese */}
        <div className="flex flex-col items-center mt-[0.1rem] relative text-gray-100">
          <div className="relative inline-block w-[90%]">
            <div
              className="relative text-center whitespace-normal break-words overflow-visible text-justify"
              style={{ fontSize: 14, top: `${size * 0.05 * 1.5}rem` }}
            >
              {card.Meaning}
            </div>
          </div>
        </div>

        {examples.length > 0 &&
          examples.map((rawExample, index) => {
              const example = (rawExample ?? "").trim();
              const isPinyinVisible = pinyinVisibility[index] ?? true; // default: show pinyin

              return (
                  <div key={index} className="relative"
                      style={{ top: `${size * 0.05 * 2}rem`,
                              left: `${size * 0.05 * 1.1}rem`}}>
                      {/* Action Row */}
                      <div className="flex items-center gap-2 leading-snug">
                      
                      {/* Translate Button */}
                      <button
                          onClick={async () => {
                          const result = await translateChineseToEnglish(example);
                          setTranslatedIndex(index);
                          setTranslatedText(result);
                          }}
                          className="flex items-center justify-center px-1 py-4 text-base hover:text-accent transition-colors"
                          data-testid={`translate-example-${index}`}
                          title="Translate"
                      >
                          <Languages className="w-4 h-4" />
                      </button>

                      {/* Speak Button */}
                      <button
                          onClick={() => speakChinese(example)}
                          className="flex items-center justify-center px-1 py-1 text-base hover:text-accent transition-colors"
                          data-testid={`speak-example-${index}`}
                          title="Speak"
                      >
                          <Volume2 className="w-4 h-4" />
                      </button>

                      {/* Pinyin Toggle Button */}
                      <button
                          onClick={() => togglePinyin(index)}
                          className="flex items-center justify-center px-1 py-1 text-base hover:text-accent transition-colors"
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
                          <div className="text-base whitespace-pre-wrap leading-[1.2] font-Winchinese text-gray-100">
                          {isPinyinVisible ? example : renderPinyinWithCharacters(example)}
                          </div>
                      </div>

                      {/* Translation text */}
                      {translatedIndex === index && translatedText && (
                          <div className="pl-3 border-l-2 border-accent text-sm text-gray-100 italic">
                          {translatedText}
                          </div>
                      )}
                      </div>
                  </div>
                  </div>
                  );

          })}
      </div>
        {/* Translation bottom-left */}
        <div className="mt-auto relative">
          <span
            className="absolute left-1/2 text-gray-100"
            style={{
              bottom: `${size * 0.05 * 1.1}rem`,
              transform: `translateX(-50%)`,
              fontSize: "var(--id-size)"
            }}
        >
          <i> {card.Translation} </i>
            </span>
        </div>
      </div>
  );
}


export function CardBack({
  card,
  onClick,
  showAnimation = false,
  className = "",
  size = 12, // 👈 Default value if not provided
}: CardProps) {
  const cardClasses = `
    relative card-3d bg-transparent rounded-[1rem] p-0 shadow-lg hover:shadow-xl 
    transition-all duration-300 cursor-pointer ${className}
    ${showAnimation ? "animate-card-reveal" : ""}
  `.trim();


  return (
    <div
      className={cardClasses}
      onClick={onClick}
      data-testid={`card-${card.Id}`}
    >
      <CardBackVisual card={card} size={size} />
    </div>
  );
}