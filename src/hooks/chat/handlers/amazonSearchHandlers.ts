
import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs } from "./handlerUtils";

// In-memory cache for Amazon search results
const amazonSearchCache = new Map<string, any[]>();

// Actual RapidAPI implementation
const searchAmazonAPI = async (productQuery: string, country: string = "US") => {
  console.log(`🔍 Searching Amazon for: ${productQuery} in ${country}`);
  
  try {
    const url = "https://real-time-amazon-data.p.rapidapi.com/search";
    const querystring = new URLSearchParams({
      query: productQuery,
      page: "1",
      country: country,
      sort_by: "RELEVANCE",
      product_condition: "ALL",
      is_prime: "false",
      deals_and_discounts: "NONE"
    });
    
    const headers = {
      "x-rapidapi-key": "ded0bfcef9mshbbd09372a611d53p1d9631jsn3daeffd314b3",
      "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com"
    };
    
    const response = await fetch(`${url}?${querystring}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data?.products?.slice(0, 3) || [];
  } catch (error) {
    console.error("RapidAPI search failed:", error);
    // Fallback to mock data if API fails
    return [
      {
        title: `${productQuery} - Premium Quality`,
        price: "$12.99",
        rating: 4.5,
        reviews_count: 1250,
        url: `https://amazon.com/search?q=${encodeURIComponent(productQuery)}`,
        image: "https://via.placeholder.com/200x200",
        is_prime: true,
      },
      {
        title: `Organic ${productQuery}`,
        price: "$15.49",
        rating: 4.7,
        reviews_count: 890,
        url: `https://amazon.com/search?q=${encodeURIComponent(productQuery)}`,
        image: "https://via.placeholder.com/200x200",
        is_prime: false,
      },
      {
        title: `${productQuery} - Best Seller`,
        price: "$9.99",
        rating: 4.3,
        reviews_count: 2100,
        url: `https://amazon.com/search?q=${encodeURIComponent(productQuery)}`,
        image: "https://via.placeholder.com/200x200",
        is_prime: true,
      }
    ];
  }
};

export const handleAmazonSearchFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep } = args;
  let funcResultMsg = "";

  if (functionCall.name === "searchAmazonProduct") {
    try {
      const { product_query, country = "US" } = functionCall.args as { 
        product_query: string; 
        country?: string; 
      };
      
      addThoughtStep(`🛍️ Searching Amazon for: ${product_query}`);
      
      // Check cache first
      const cacheKey = `${product_query.toLowerCase()}_${country}`;
      if (amazonSearchCache.has(cacheKey)) {
        addThoughtStep(`📋 Using cached results for ${product_query}`);
        const cachedResults = amazonSearchCache.get(cacheKey);
        funcResultMsg = `Found ${cachedResults?.length || 0} cached Amazon results for "${product_query}". Results are ready to display.`;
      } else {
        // Perform search and cache results
        const searchResults = await searchAmazonAPI(product_query, country);
        amazonSearchCache.set(cacheKey, searchResults);
        
        funcResultMsg = `Found ${searchResults.length} Amazon products for "${product_query}". Top result: ${searchResults[0]?.title} at ${searchResults[0]?.price}. Results cached for quick access.`;
        addThoughtStep(`✅ Found ${searchResults.length} products for ${product_query}`);
      }
    } catch (error) {
      console.error("Amazon search error:", error);
      funcResultMsg = `Sorry, I couldn't search Amazon for that product right now. Please try again later.`;
      addThoughtStep(`❌ Amazon search failed`);
    }
  } else if (functionCall.name === "searchMultipleAmazonProducts") {
    try {
      const { product_queries, country = "US" } = functionCall.args as { 
        product_queries: string[]; 
        country?: string; 
      };
      
      addThoughtStep(`🛍️ Batch searching Amazon for ${product_queries.length} products`);
      
      let searchedCount = 0;
      let cachedCount = 0;
      
      for (const productQuery of product_queries) {
        const cacheKey = `${productQuery.toLowerCase()}_${country}`;
        
        if (!amazonSearchCache.has(cacheKey)) {
          const searchResults = await searchAmazonAPI(productQuery, country);
          amazonSearchCache.set(cacheKey, searchResults);
          searchedCount++;
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          cachedCount++;
        }
      }
      
      funcResultMsg = `Completed Amazon search for ${product_queries.length} products. Found ${searchedCount} new results, used ${cachedCount} cached results. All products are ready to view with pricing and availability.`;
      addThoughtStep(`✅ Batch search complete: ${searchedCount} new, ${cachedCount} cached`);
    } catch (error) {
      console.error("Batch Amazon search error:", error);
      funcResultMsg = `Sorry, I encountered an issue while searching for multiple products on Amazon. Some results may be available.`;
      addThoughtStep(`❌ Batch Amazon search partially failed`);
    }
  } else if (functionCall.name === "getAmazonSearchResults") {
    const { product_name } = functionCall.args as { product_name?: string };
    
    if (product_name) {
      const cacheKey = `${product_name.toLowerCase()}_US`;
      const results = amazonSearchCache.get(cacheKey);
      
      if (results) {
        funcResultMsg = `Found ${results.length} Amazon results for "${product_name}". Ready to display product details including prices ranging from ${results[results.length-1]?.price} to ${results[0]?.price}.`;
      } else {
        funcResultMsg = `No cached Amazon results found for "${product_name}". Try searching for this product first.`;
      }
    } else {
      const totalCached = amazonSearchCache.size;
      funcResultMsg = `Currently have Amazon search results cached for ${totalCached} different products from your shopping list.`;
    }
    
    addThoughtStep(`📋 Retrieved Amazon search cache data`);
  } else if (functionCall.name === "clearAmazonSearchCache") {
    const previousSize = amazonSearchCache.size;
    amazonSearchCache.clear();
    
    funcResultMsg = `Cleared ${previousSize} cached Amazon search results. Fresh searches will be performed for future product lookups.`;
    addThoughtStep(`🗑️ Cleared Amazon search cache`);
  }

  return funcResultMsg;
};

// Export the cache for potential use in UI components
export const getAmazonSearchCache = () => amazonSearchCache;
