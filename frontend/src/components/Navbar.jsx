import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

/** Brand logo + identity used on auth pages and the dashboard. */
export default function Navbar({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex items-center justify-center rounded-xl bg-cerulean ${
          compact ? "h-8 w-8" : "h-10 w-10"
        }`}
        style={compact ? undefined : { boxShadow: "0 0 16px rgba(0,127,255,0.35)" }}
      >
        <MessageCircle className={compact ? "h-[18px] w-[18px]" : "h-5 w-5"} color="#FFFFFF" />
      </div>
      <Link to="/" className="leading-tight">
        <span className={`font-bold tracking-tight text-text-primary ${compact ? "text-base" : "text-lg"}`}>
          ChatConnect
        </span>
        {!compact && (
          <span className="block text-[11px] font-medium text-text-secondary">
            Real-time messaging
          </span>
        )}
      </Link>
    </div>
  );
}
