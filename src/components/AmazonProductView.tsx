import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, ExternalLink, Package, Trash2, Award, Truck } from "lucide-react";
import { getAmazonSearchCache, deleteCachedResults, deleteProductFromSearchCache } from "@/hooks/chat/handlers/amazonSearchHandlers";
import { toast } from "sonner";

interface AmazonProduct {
  asin: string;
  product_title: string;
  product_price?: string;
  product_original_price?: string | null;
  currency?: string;
  product_star_rating?: string;
  product_num_ratings?: number;
  product_url?: string;
  product_photo?: string;
  product_minimum_offer_price?: string;
  product_num_offers?: number;
  is_best_seller?: boolean;
  is_amazon_choice?: boolean;
  is_prime?: boolean;
  sales_volume?: string;
  delivery?: string;
  product_availability?: string;
  climate_pledge_friendly?: boolean;
  has_variations?: boolean;
  product_badge?: string;
  product_byline?: string;
  unit_price?: string;
  unit_count?: number;
}

interface AmazonProductViewProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export const AmazonProductView = ({ isOpen, onClose, productName }: AmazonProductViewProps) => {
  const [products, setProducts] = React.useState<AmazonProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadProducts = React.useCallback(async () => {
    if (isOpen && productName) {
      setIsLoading(true);
      console.log(`Loading products for: ${productName}`);
      try {
        const cachedProducts = await getAmazonSearchCache(productName);
        console.log(`Loaded ${cachedProducts.length} products:`, cachedProducts);
        setProducts(cachedProducts);
        
        if (cachedProducts.length === 0) {
          console.log(`No cached products found for: ${productName}`);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load Amazon products');
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, productName]);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  React.useEffect(() => {
    if (isOpen && productName) {
      console.log(`AmazonProductView opened for: ${productName}`);
    }
  }, [isOpen, productName]);

  const handleRemoveFromCache = async () => {
    try {
      await deleteCachedResults(productName);
      toast.success(`Removed ${productName} from Amazon cache`);
      setProducts([]);
      onClose();
    } catch (error) {
      console.error('Error removing from cache:', error);
      toast.error('Failed to remove from cache');
    }
  };

  const handleRemoveProduct = async (product: AmazonProduct) => {
    try {
      await deleteProductFromSearchCache(productName, product.asin);
      toast.success(`Removed ${product.product_title} from list`);
      // Reload products to reflect the change
      await loadProducts();
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Failed to remove product');
    }
  };

  const renderStars = (rating: string | number) => {
    const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    if (isNaN(numRating)) return null;
    
    const stars = [];
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />);
    }
    
    const remainingStars = 5 - Math.ceil(numRating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const formatPrice = (product: AmazonProduct) => {
    if (product.product_price) {
      return product.product_price;
    }
    if (product.product_minimum_offer_price) {
      return `From ${product.product_minimum_offer_price}`;
    }
    return "Price not available";
  };

  const getProductBadges = (product: AmazonProduct) => {
    const badges = [];
    
    if (product.is_best_seller) {
      badges.push(
        <Badge key="bestseller" variant="destructive" className="text-xs">
          <Award className="w-3 h-3 mr-1" />
          Best Seller
        </Badge>
      );
    }
    
    if (product.is_amazon_choice) {
      badges.push(
        <Badge key="choice" variant="secondary" className="text-xs bg-orange-100 text-orange-800">
          Amazon's Choice
        </Badge>
      );
    }
    
    if (product.is_prime) {
      badges.push(
        <Badge key="prime" variant="outline" className="text-xs text-blue-600 border-blue-600">
          <Truck className="w-3 h-3 mr-1" />
          Prime
        </Badge>
      );
    }
    
    if (product.climate_pledge_friendly) {
      badges.push(
        <Badge key="climate" variant="outline" className="text-xs text-green-600 border-green-600">
          Climate Pledge Friendly
        </Badge>
      );
    }
    
    if (product.product_badge) {
      badges.push(
        <Badge key="custom" variant="secondary" className="text-xs">
          {product.product_badge}
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Amazon Results for "{productName}" ({products.length} products)
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
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <Card key={product.asin || index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img 
                      src={product.product_photo || "https://via.placeholder.com/300x300?text=No+Image"} 
                      alt={product.product_title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x300?text=No+Image";
                      }}
                    />
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {/* Product Badges */}
                    <div className="flex flex-wrap gap-1">
                      {getProductBadges(product)}
                    </div>
                    
                    {/* Product Title */}
                    <h3 className="font-medium text-sm line-clamp-3 leading-tight min-h-[3.6rem]">
                      {product.product_title}
                    </h3>
                    
                    {/* Product Byline */}
                    {product.product_byline && (
                      <div className="text-xs text-muted-foreground">
                        {product.product_byline}
                      </div>
                    )}
                    
                    {/* Price Section */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(product)}
                        </div>
                        {product.currency && (
                          <span className="text-xs text-muted-foreground">
                            {product.currency}
                          </span>
                        )}
                      </div>
                      
                      {/* Original Price & Savings */}
                      {product.product_original_price && product.product_original_price !== product.product_price && (
                        <div className="text-sm text-muted-foreground line-through">
                          Was: {product.product_original_price}
                        </div>
                      )}
                      
                      {/* Unit Price */}
                      {product.unit_price && (
                        <div className="text-xs text-muted-foreground">
                          {product.unit_price} per unit
                        </div>
                      )}
                      
                      {/* Multiple Offers */}
                      {product.product_num_offers && product.product_num_offers > 1 && (
                        <div className="text-xs text-blue-600">
                          {product.product_num_offers} offers available
                        </div>
                      )}
                    </div>
                    
                    {/* Rating Section */}
                    {product.product_star_rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {renderStars(product.product_star_rating)}
                        </div>
                        <span className="text-sm font-medium">
                          {product.product_star_rating}
                        </span>
                        {product.product_num_ratings && (
                          <span className="text-sm text-muted-foreground">
                            ({product.product_num_ratings.toLocaleString()} reviews)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Sales Volume */}
                    {product.sales_volume && (
                      <div className="text-xs text-muted-foreground">
                        {product.sales_volume}
                      </div>
                    )}
                    
                    {/* Availability */}
                    {product.product_availability && (
                      <div className="text-xs text-orange-600 font-medium">
                        {product.product_availability}
                      </div>
                    )}
                    
                    {/* Delivery Information */}
                    {product.delivery && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        <div className="line-clamp-2">
                          {product.delivery}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => product.product_url && window.open(product.product_url, '_blank')}
                        size="sm"
                        disabled={!product.product_url}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Amazon
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProduct(product)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
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
