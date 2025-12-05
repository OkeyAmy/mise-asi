/**
 * @deprecated This module is deprecated in favor of asiProxy.ts
 * The mise-asi Python service now handles orchestration instead of Supabase functions.
 * 
 * To use the new ASI system:
 * 1. Start the ASI server: cd mise-asi && python main.py
 * 2. Import from asiProxy.ts instead: import { callASIProxy } from './asiProxy'
 * 
 * This file now re-exports from asiProxy for backwards compatibility.
 */

// Re-export the backwards-compatible wrapper with userId support
export { callGeminiProxy } from './asiProxy';
