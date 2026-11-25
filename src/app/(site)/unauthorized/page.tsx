import { ShieldAlert } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export const metadata = { title: "Access denied" };

export default function UnauthorizedPage() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <ShieldAlert className="h-14 w-14 text-primary" />
      <h1 className="mt-4 text-3xl font-bold">You don&apos;t have access to this page</h1>
      <p className="mt-2 max-w-md text-muted-foreground">This area is reserved for a different role. If you think this is a mistake, contact the She Learn team.</p>
      <div className="mt-6 flex gap-3">
        <LinkButton href="/dashboard">Go to my dashboard</LinkButton>
        <LinkButton href="/contact" variant="outline">
          Contact support
        </LinkButton>
      </div>
    </div>
  );
}
