
export const getUserTimezone = (): string => {
  try {
    // Return the user's timezone from browser settings
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.error("Could not determine user timezone, falling back to UTC.", e);
    return "UTC"; // Fallback to UTC if timezone is not available
  }
};
