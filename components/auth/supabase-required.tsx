import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SupabaseRequired() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Supabase</CardTitle>
        <CardDescription>
          Add <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="text-foreground">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          to <code className="text-foreground">.env.local</code> (see{" "}
          <code className="text-foreground">.env.example</code>).
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Auth and protected routes need these variables. Restart the dev server
        after updating env.
      </CardContent>
    </Card>
  );
}
