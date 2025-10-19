import { 
  getImageUrl,
  type ChineseWord
} from "@/lib/card-utils";
import { useState } from "react";
import { pinyinNumericToAccents } from "./pinyinUtils";


interface CardVisualProps {
  card: ChineseWord;
  size?: "xs" | "s" | "m" | "l" | "xl";

}


export function CardVisual({ card, size = "m" }: CardVisualProps) {
  const [imageError, setImageError] = useState(false);

  const sizeStyles = {
    xs: { width: "w-[8rem]", text: "text-[0.3em]", chinese: "text-[0.9em]", id: "text-[0.32em]",proportion: 0.47, imageSize: 358 },
    s:  { width: "w-[10rem]", text: "text-[0.38em]", chinese: "text-[1.1em]", id: "text-[0.4em]",proportion: 0.59, imageSize: 256 },
    m:  { width: "w-[12rem]", text: "text-[0.45em]", chinese: "text-[1.3em]", id: "text-[0.48em]",proportion: 0.71, imageSize: 512 },
    l:  { width: "w-[13.5rem]", text: "text-[0.51em]", chinese: "text-[1.49em]", id: "text-[0.54em]",proportion: 0.8, imageSize: 512 },
    xl: { width: "w-[17rem]", text: "text-[0.67em]", chinese: "text-[1.97em]", id: "text-[0.72em]",proportion: 1, imageSize: 512 },
  } as const;

  const style = sizeStyles[size] ?? sizeStyles.m; // fallback to 'm'
  const imageUrl = getImageUrl(card, style.imageSize);
  function formatCategory(category: string): string {
    if (!category) return '';
    const formatted = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return formatted.length > 6 ? formatted.slice(0, 5) + '.' : formatted;
  }
  // 👇 Dynamic layout image URL fetched from render server
  //const layoutUrl = getLayoutImageUrl(card.HSK ?? 1);

  return (
        <div className={`aspect-[512/720] relative ${style.width} overflow-hidden rounded-lg`}>
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
      
      <div className={`absolute inset-0 flex flex-col h-full text-center font-sans ${style.height}`}>
        {/* HSK top-left */}
        <div className={`${style.text} absolute right-2 px-2`} style={{ top: `${style.proportion * 1}rem` }}>
          HSK {card.HSK}
        </div>
        <div
          className="absolute flex flex-col gap-1"
          style={{
            top: `${style.proportion * 0.55}rem`,
            left: `${style.proportion * 0.6}rem`
          }}
        >
          {card.Category.split('/').map((cat: string, index: number) => (
            <div
              key={index}
              className={`badge ${cat.trim().toLowerCase()} `}
              style={{
                padding: `${1 * style.proportion}px ${5 * style.proportion}px`,
                borderRadius: `${5 * style.proportion}px`,
                fontSize: `${0.6 * style.proportion}rem`,
                textTransform: 'none',
                backgroundColor: 'white',
                borderWidth: `${1 * style.proportion}px`, // just width
                borderStyle: 'solid',                     // just style
                color: '#333'
              }}
            >
              {formatCategory(cat)}
            </div>
          ))}
        </div>
        <div className={`${style.text} text-black py-2`}>
          {pinyinNumericToAccents(card.Pinyin)}
        </div>

        <div className="flex flex-col items-center mt-0.1 font-chinese">
          <div className="relative inline-block whitespace-nowrap leading-[0.5]">
            <div
              className={`${style.chinese} relative z-10 font-extrabold `}
            >
              {card.Chinese}
            </div>
          </div>
        </div>

        <div className="mt-auto relative">
          <span
            className={`${style.id} text-black absolute left-1/2`}
            style={{
              bottom: `${style.proportion * 0.7}rem`,
              transform: 'translateX(-50%)'
            }}
          >
            {card.Id}
          </span>
        </div>
        {/* Theme bottom-right */}
        <div className={`${style.text} absolute left-2 px-2 text-gray-700`}
        style={{
              bottom: `${style.proportion}rem`
            }}>
          
          {card.Translation}
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  card: ChineseWord & { isNew?: boolean; unlocked?: boolean };
  onClick?: () => void;
  showAnimation?: boolean;
  className?: string;
  size?: "xs" | "s" | "m" | "l" | "xl";// 👈 Add this line
};

// Component
export default function Card({
  card,
  onClick,
  showAnimation = false,
  className = "",
  size = "m", // 👈 Default value if not provided
}: CardProps) {
  const cardClasses = `
    relative card-3d bg-card border border-border rounded-xl p-0 shadow-lg hover:shadow-xl 
    transition-all duration-300 cursor-pointer  ${className}
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

      {/* 👇 Use the size prop here */}
      <CardVisual card={card} size={size} />
    </div>
  );
}