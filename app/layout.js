import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Thomas' Recipes",
  description: "A collection of my favourite recipes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              Thomas' <span>Recipes</span>
            </Link>
            <nav className="header-nav">
              <Link href="/admin" className="btn btn-secondary">
                + Add Recipe
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
