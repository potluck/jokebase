import type { Metadata } from "next";

export const metadata: Metadata = { title: "Log in" };

const errors: Record<string, string> = {
  state: "Login expired or was interrupted. Please try again.",
  token: "Google rejected the login. Please try again.",
  userinfo: "Couldn't read your Google profile. Please try again.",
  email: "Your Google account needs a verified email.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const href = next
    ? `/auth/login?next=${encodeURIComponent(next)}`
    : "/auth/login";

  return (
    <div className="flex flex-col items-center gap-6 pt-24 text-center">
      <h1 className="text-2xl font-bold">Log in to jokebase</h1>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errors[error] ?? "Something went wrong. Please try again."}
        </p>
      )}
      {/* Plain anchor: this is a full-page redirect to Google, not a client nav. */}
      <a
        href={href}
        className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 text-sm font-medium transition-colors"
      >
        Continue with Google
      </a>
    </div>
  );
}
