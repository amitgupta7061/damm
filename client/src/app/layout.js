import "./globals.css";

export const metadata = {
  title: "CollabDraw — Real-time Collaborative Whiteboard",
  description:
    "Draw together in real-time. Create a room, share the link, and collaborate on a beautiful infinite canvas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
