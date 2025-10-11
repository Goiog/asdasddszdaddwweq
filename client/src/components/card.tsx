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
    xs: { width: "w-[8rem]", text: "text-[0.3em]", chinese: "text-[0.9em]", id: "text-[0.32em]", imageSize: 358 },
    s:  { width: "w-[10rem]", text: "text-[0.38em]", chinese: "text-[1.1em]", id: "text-[0.4em]", imageSize: 358 },
    m:  { width: "w-[12rem]", text: "text-[0.45em]", chinese: "text-[1.3em]", id: "text-[0.48em]", imageSize: 512 },
    l:  { width: "w-[13.5rem]", text: "text-[0.51em]", chinese: "text-[1.49em]", id: "text-[0.54em]", imageSize: 512 },
    xl: { width: "w-[20rem]", text: "text-[0.75em]", chinese: "text-[2.2em]", id: "text-[0.8em]", imageSize: 512 },
  } as const;

  const style = sizeStyles[size] ?? sizeStyles.m; // fallback to 'm'
  const imageUrl = getImageUrl(card, style.imageSize);

  // 👇 Dynamic layout image URL fetched from render server
  //const layoutUrl = getLayoutImageUrl(card.HSK ?? 1);

  return (
        <div className={`aspect-[768/1024] relative ${style.width} overflow-hidden rounded-lg`}>
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
        <div className={`${style.text} text-black drop-shadow-[0_0_4px_white]`}>
          {pinyinNumericToAccents(card.Pinyin)}
        </div>

        <div className="flex flex-col items-center mt-0.1 font-chinese">
          <div className="relative inline-block whitespace-nowrap leading-[1]">
            <div
              className={`${style.chinese} relative z-10 font-extrabold bg-gradient-to-b from-black via-gray-800 to-black bg-clip-text text-transparent drop-shadow-[0_0_10px_white]`}
            >
              {card.Chinese}
            </div>
          </div>
        </div>

        <div className="mt-auto text-center">
          <span className={`${style.id} text-black drop-shadow-[0_0_4px_white]`}>
            {card.Id}
          </span>
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
    transition-all duration-300 cursor-pointer card-${card.rarity} ${className}
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