
import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs } from "./handlerUtils";
import { supabase } from "@/integrations/supabase/client";

// Type definitions for Amazon search API response (matching actual RapidAPI structure)
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

interface AmazonSearchResponse {
  status: string;
  request_id: string;
  parameters?: {
    query: string;
    country: string;
    sort_by: string;
    page: number;
    is_prime: boolean;
  };
  data?: {
    total_products: number;
    country: string;
    domain: string;
    products: AmazonProduct[];
  };
}

// Type for cached search results with proper Json handling
interface CachedSearchResult {
  user_id: string;
  product_query: string;
  country: string;
  search_results: unknown; // Use unknown first, then cast to AmazonProduct[]
  created_at?: string;
  updated_at?: string;
}

// Get RapidAPI key from Supabase secrets
const getRapidAPIKey = async (): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('get-secret', {
    body: { name: 'RAPIDAPI_KEY' }
  });
  
  if (error || !data?.value) {
    throw new Error('RapidAPI key not found in Supabase secrets');
  }
  
  return data.value;
};

// Real RapidAPI implementation with correct endpoint and parameters
const searchAmazonAPI = async (productQuery: string, country: string = "US"): Promise<AmazonProduct[]> => {
  console.log(`🔍 Searching Amazon for: ${productQuery} in ${country}`);
  
  try {
    const apiKey = await getRapidAPIKey();
    
    const url = "https://real-time-amazon-data.p.rapidapi.com/search";
    const querystring = new URLSearchParams({
      query: productQuery,
      page: "1",
      country: country,
      sort_by: "RELEVANCE",
      is_prime: "false"
    });
    
    const headers = {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com"
    };
    
    const response = await fetch(`${url}?${querystring}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Amazon API request failed with status: ${response.status}`);
    }
    
    const data: AmazonSearchResponse = await response.json();
    console.log('🔍 Amazon API Response:', data);
    
    if (data.status !== "OK" || !data.data || !data.data.products) {
      throw new Error('Invalid response format from Amazon API');
    }
    
    return data.data.products.slice(0, 3) || [];
  } catch (error) {
    console.error("Amazon API search failed:", error);
    throw error;
  }
};

// Database operations for Amazon search cache with proper type handling
const getCachedSearchResults = async (productQuery: string, country: string = "US"): Promise<CachedSearchResult | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase
    .from('amazon_search_cache')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('product_query', productQuery.toLowerCase())
    .eq('country', country)
    .single();

  if (error) {
    console.log('No cached results found:', error);
    return null;
  }

  return data as unknown as CachedSearchResult;
};

const saveCachedSearchResults = async (productQuery: string, searchResults: AmazonProduct[], country: string = "US") => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { error } = await supabase
    .from('amazon_search_cache')
    .upsert({
      user_id: user.user.id,
      product_query: productQuery.toLowerCase(),
      country: country,
      search_results: searchResults as unknown as any // Cast to satisfy Supabase Json type
    });

  if (error) {
    console.error('Error saving cache:', error);
  } else {
    console.log('✅ Cached search results for:', productQuery);
  }
};

const deleteCachedSearchResults = async (productQuery: string, country: string = "US") => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { error } = await supabase
    .from('amazon_search_cache')
    .delete()
    .eq('user_id', user.user.id)
    .eq('product_query', productQuery.toLowerCase())
    .eq('country', country);

  if (error) {
    console.error('Error deleting cache:', error);
  } else {
    console.log('🗑️ Deleted cached results for:', productQuery);
  }
};

// New function to delete individual product from cache
const deleteProductFromCache = async (productQuery: string, asin: string, country: string = "US") => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  // Get current cached results
  const cachedData = await getCachedSearchResults(productQuery, country);
  if (!cachedData) return;

  const currentResults = cachedData.search_results as AmazonProduct[];
  
  // Filter out the product with the specified ASIN
  const updatedResults = currentResults.filter(product => product.asin !== asin);

  if (updatedResults.length === 0) {
    // If no products left, delete the entire cache entry
    await deleteCachedSearchResults(productQuery, country);
  } else {
    // Update cache with remaining products
    const { error } = await supabase
      .from('amazon_search_cache')
      .update({
        search_results: updatedResults as unknown as any,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.user.id)
      .eq('product_query', productQuery.toLowerCase())
      .eq('country', country);

    if (error) {
      console.error('Error updating cache:', error);
    } else {
      console.log('✅ Removed product from cache:', asin);
    }
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
      
      // Check database cache first
      const cachedData = await getCachedSearchResults(product_query, country);
      if (cachedData) {
        addThoughtStep(`📋 Using cached results for ${product_query}`);
        const cachedResults = cachedData.search_results as AmazonProduct[];
        funcResultMsg = `Found ${cachedResults?.length || 0} cached Amazon results for "${product_query}". Results are ready to display.`;
      } else {
        // Perform search and cache results
        const searchResults = await searchAmazonAPI(product_query, country);
        await saveCachedSearchResults(product_query, searchResults, country);
        
        const topProduct = searchResults[0];
        const productTitle = topProduct?.product_title || 'Unknown Product';
        const productPrice = topProduct?.product_price || 'Price unavailable';
        
        funcResultMsg = `Found ${searchResults.length} Amazon products for "${product_query}". Top result: ${productTitle} at ${productPrice}. Results cached for quick access.`;
        addThoughtStep(`✅ Found ${searchResults.length} products for ${product_query}`);
      }
    } catch (error) {
      console.error("Amazon search error:", error);
      const args_typed = functionCall.args as { product_query?: string };
      funcResultMsg = `Sorry, I couldn't search Amazon for "${args_typed?.product_query || 'the requested product'}" right now. There was an issue with the search API. Please try again later.`;
      addThoughtStep(`❌ Amazon search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      let failedCount = 0;
      
      for (const productQuery of product_queries) {
        const cachedData = await getCachedSearchResults(productQuery, country);
        
        if (!cachedData) {
          try {
            const searchResults = await searchAmazonAPI(productQuery, country);
            await saveCachedSearchResults(productQuery, searchResults, country);
            searchedCount++;
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Failed to search for ${productQuery}:`, error);
            failedCount++;
          }
        } else {
          cachedCount++;
        }
      }
      
      if (failedCount > 0) {
        funcResultMsg = `Completed Amazon search for ${product_queries.length} products. Found ${searchedCount} new results, used ${cachedCount} cached results, ${failedCount} searches failed. Some products may not be available to view.`;
      } else {
        funcResultMsg = `Completed Amazon search for ${product_queries.length} products. Found ${searchedCount} new results, used ${cachedCount} cached results. All products are ready to view with pricing and availability.`;
      }
      
      addThoughtStep(`✅ Batch search complete: ${searchedCount} new, ${cachedCount} cached, ${failedCount} failed`);
    } catch (error) {
      console.error("Batch Amazon search error:", error);
      funcResultMsg = `Sorry, I encountered an issue while searching for multiple products on Amazon. The search API is currently unavailable. Please try again later.`;
      addThoughtStep(`❌ Batch Amazon search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else if (functionCall.name === "getAmazonSearchResults") {
    const { product_name } = functionCall.args as { product_name?: string };
    
    if (product_name) {
      const cachedData = await getCachedSearchResults(product_name);
      
      if (cachedData) {
        const results = cachedData.search_results as AmazonProduct[];
        const highestPrice = results[0]?.product_price || 'N/A';
        const lowestPrice = results[results.length-1]?.product_price || 'N/A';
        funcResultMsg = `Found ${results.length} Amazon results for "${product_name}". Ready to display product details including prices ranging from ${lowestPrice} to ${highestPrice}.`;
      } else {
        funcResultMsg = `No cached Amazon results found for "${product_name}". Try searching for this product first.`;
      }
    } else {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: cachedResults } = await supabase
          .from('amazon_search_cache')
          .select('product_query')
          .eq('user_id', user.user.id);
        
        const totalCached = cachedResults?.length || 0;
        funcResultMsg = `Currently have Amazon search results cached for ${totalCached} different products from your shopping list.`;
      }
    }
    
    addThoughtStep(`📋 Retrieved Amazon search cache data`);
  } else if (functionCall.name === "clearAmazonSearchCache") {
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      const { data: cachedResults } = await supabase
        .from('amazon_search_cache')
        .select('id')
        .eq('user_id', user.user.id);
      
      const previousSize = cachedResults?.length || 0;
      
      const { error } = await supabase
        .from('amazon_search_cache')
        .delete()
        .eq('user_id', user.user.id);
      
      if (error) {
        funcResultMsg = `Failed to clear Amazon search cache: ${error.message}`;
      } else {
        funcResultMsg = `Cleared ${previousSize} cached Amazon search results. Fresh searches will be performed for future product lookups.`;
      }
    }
    
    addThoughtStep(`🗑️ Cleared Amazon search cache`);
  }

  return funcResultMsg;
};

// Export function to get cached results for UI components
export const getAmazonSearchCache = async (productName?: string): Promise<AmazonProduct[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  if (productName) {
    const cachedData = await getCachedSearchResults(productName);
    if (!cachedData || !cachedData.search_results) return [];
    
    // Ensure we're working with an array of products
    const searchResults = cachedData.search_results;
    if (Array.isArray(searchResults)) {
      return searchResults as AmazonProduct[];
    }
    
    return [];
  }

  const { data: allCached } = await supabase
    .from('amazon_search_cache')
    .select('*')
    .eq('user_id', user.user.id);

  if (!allCached) return [];
  
  // Flatten all search results from all cached searches
  const allResults: AmazonProduct[] = [];
  allCached.forEach((cache: any) => {
    if (cache.search_results && Array.isArray(cache.search_results)) {
      allResults.push(...(cache.search_results as AmazonProduct[]));
    }
  });
  
  return allResults;
};

// Export function to delete cached results from UI
export const deleteCachedResults = async (productName: string) => {
  await deleteCachedSearchResults(productName);
};

// Export function to delete individual product from UI
export const deleteProductFromSearchCache = async (productName: string, asin: string) => {
  await deleteProductFromCache(productName, asin);
};
