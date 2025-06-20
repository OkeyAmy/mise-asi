
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const searchAmazonProductTool: FunctionDeclaration = {
  name: "searchAmazonProduct",
  description: "Search for a specific product on Amazon based on the product name from the shopping list. This runs as a background task to find matching products.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      product_name: {
        type: SchemaType.STRING,
        description: "The name of the product to search for on Amazon (e.g., 'Organic Bananas', 'Whole Milk')"
      },
      quantity: {
        type: SchemaType.NUMBER,
        description: "The quantity needed from the shopping list"
      },
      unit: {
        type: SchemaType.STRING,
        description: "The unit of measurement from the shopping list (e.g., 'bunch', 'gallon', 'lb')"
      }
    },
    required: ["product_name", "quantity", "unit"]
  }
};

export const searchMultipleAmazonProductsTool: FunctionDeclaration = {
  name: "searchMultipleAmazonProducts",
  description: "Search for multiple products from the shopping list on Amazon in a single background operation. More efficient than searching one by one.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      shopping_list_items: {
        type: SchemaType.ARRAY,
        description: "Array of shopping list items to search for on Amazon",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            product_name: {
              type: SchemaType.STRING,
              description: "The name of the product to search for"
            },
            quantity: {
              type: SchemaType.NUMBER,
              description: "The quantity needed"
            },
            unit: {
              type: SchemaType.STRING,
              description: "The unit of measurement"
            }
          },
          required: ["product_name", "quantity", "unit"]
        }
      }
    },
    required: ["shopping_list_items"]
  }
};

export const getAmazonSearchResultsTool: FunctionDeclaration = {
  name: "getAmazonSearchResults",
  description: "Retrieve the Amazon search results for a specific shopping list item that was previously searched.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      product_name: {
        type: SchemaType.STRING,
        description: "The name of the product to get Amazon search results for"
      }
    },
    required: ["product_name"]
  }
};

export const clearAmazonSearchCacheTool: FunctionDeclaration = {
  name: "clearAmazonSearchCache",
  description: "Clear all cached Amazon search results to free up memory or refresh search data.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {}
  }
};
