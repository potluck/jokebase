import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/nav";
import { getSession } from "./lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "jokebase",
    template: "%s · jokebase",
  },
  description: "Standup comedy set tracker",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    siteName: "jokebase",
    title: "jokebase",
    description: "Standup comedy set tracker",
    images: [{ url: "/og.png", width: 800, height: 800 }],
  },
  twitter: {
    card: "summary",
    title: "jokebase",
    description: "Standup comedy set tracker",
    images: ["/og.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Nav user={session ? { name: session.name, email: session.email } : null} />
        <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
