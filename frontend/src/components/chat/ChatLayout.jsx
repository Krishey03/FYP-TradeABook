import { Outlet } from "react-router-dom";

export default function ChatLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
}