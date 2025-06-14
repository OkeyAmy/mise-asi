
import { Avatar, AvatarFallback } from "./ui/avatar";
import { CardHeader, CardTitle } from "./ui/card";
import { Bot } from "lucide-react";

export const ChatHeader = () => {
    return (
        <CardHeader className="flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                </Avatar>
                <CardTitle>NutriMate AI</CardTitle>
            </div>
        </CardHeader>
    );
}
