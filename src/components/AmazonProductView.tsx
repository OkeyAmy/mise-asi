
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, ExternalLink, Package } from "lucide-react";
import { getAmazonSearchCache } from "@/hooks/chat/handlers/amazonSearchHandlers";

interface AmazonProduct {
  title: string;
  price: string;
  rating: number;
  reviews_count: number;
  url: string;
  image: string;
  is_prime: boolean;
}

interface AmazonProductViewProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export const AmazonProductView = ({ isOpen, onClose, productName }: AmazonProductViewProps) => {
  const [products, setProducts] = React.useState<AmazonProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && productName) {
      setIsLoading(true);
      const cache = getAmazonSearchCache();
      const cacheKey = `${productName.toLowerCase()}_US`;
      const cachedProducts = cache.get(cacheKey) || [];
      setProducts(cachedProducts);
      setIsLoading(false);
    }
  }, [isOpen, productName]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Amazon Results for "{productName}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading Amazon products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">No Amazon results found for this product.</div>
              <div className="text-sm text-muted-foreground">Try asking the AI to search for this product first.</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=No+Image";
                      }}
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-600">
                          {product.price}
                        </div>
                        {product.is_prime && (
                          <Badge variant="secondary" className="text-xs">
                            Prime
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {renderStars(product.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {product.rating}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews_count?.toLocaleString() || 0} reviews)
                        </span>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => window.open(product.url, '_blank')}
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Amazon
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
