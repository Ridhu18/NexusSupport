import "./globals.css";

export const metadata = {
  title: "NexusSupport | Premium IT Ticketing System",
  description: "Enterprise grade glassmorphic ticketing dashboard for streamlined client and support team workflows.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {/* Floating animated grid background and neon glow orbs */}
        <div className="grid-bg"></div>
        <div className="orb orb-primary"></div>
        <div className="orb orb-secondary"></div>
        
        {children}
      </body>
    </html>
  );
}
