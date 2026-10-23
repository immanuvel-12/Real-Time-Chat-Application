import { Link } from "react-router-dom";
import { MessageCircleWarning } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-jet px-4">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cerulean/15">
          <MessageCircleWarning className="h-7 w-7 text-cerulean" />
        </div>
        <h1 className="text-5xl font-bold text-text-primary">404</h1>
        <p className="mt-2 text-sm text-text-secondary">
          That page doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Back to chat
        </Link>
      </div>
    </main>
  );
}
