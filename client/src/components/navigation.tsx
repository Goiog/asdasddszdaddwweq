import { Link, useLocation } from "wouter";
import { Gift, Layers, Brain } from "lucide-react";

interface NavigationProps {
  cardCount: number;
  totalCards: number;
}

export default function Navigation({ cardCount, totalCards }: NavigationProps) {
  const [location] = useLocation();

  return (
    <nav className="bg-secondary border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="text-primary text-2xl">🃏</div>
            <h1 className="text-xl font-bold text-foreground">Chinese Cards</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              href="/" 
              className={`px-4 py-2 rounded-lg transition-colors ${
                location === "/" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid="nav-pack-opening"
            >
              <Gift className="inline mr-2 h-4 w-4" />
              Pack Opening
            </Link>
            <Link 
              href="/collection" 
              className={`px-4 py-2 rounded-lg transition-colors ${
                location === "/collection" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid="nav-collection"
            >
              <Layers className="inline mr-2 h-4 w-4" />
              Collection
            </Link>
            <Link 
              href="/training" 
              className={`px-4 py-2 rounded-lg transition-colors ${
                location === "/training" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid="nav-training"
            >
              <Brain className="inline mr-2 h-4 w-4" />
              Training area
            </Link>
            
            <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
              <span className="text-yellow-500">🎴</span>
              <span className="font-semibold" data-testid="card-count">{cardCount}</span>
              <span className="text-muted-foreground">/ {totalCards}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
