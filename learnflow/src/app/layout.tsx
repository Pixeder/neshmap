import "./globals.css";
import "katex/dist/katex.min.css";
export const metadata = { title: "LearnFlow" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
