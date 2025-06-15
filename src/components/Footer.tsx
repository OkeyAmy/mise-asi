
export const Footer = () => (
  <footer className="fixed bottom-0 left-0 w-full z-30 bg-background border-t shadow-inner h-12 flex items-center justify-center px-4">
    <span className="text-xs text-muted-foreground">
      © {new Date().getFullYear()} NutriMate AI &middot; All rights reserved.
    </span>
  </footer>
);
