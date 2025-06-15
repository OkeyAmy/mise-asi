
import { ChatHeader } from "./ChatHeader";

export const Header = () => (
  <header className="fixed top-0 left-0 w-full z-30 bg-background border-b shadow-sm h-16 flex items-center px-4">
    <div className="flex-1 flex items-center">
      <ChatHeader />
    </div>
  </header>
);
