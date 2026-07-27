import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getSessionFn } from "#/server/session";
import appCss from "../styles.css?url";
type Session = Awaited<ReturnType<typeof getSessionFn>>;
export interface RouterContext {
  queryClient: QueryClient;
  session?: Session;
}
const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('theme')||'auto';var d=m==='dark'||(m==='auto'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;
const SERVICE_WORKER_SCRIPT = `if('serviceWorker'in navigator){addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(error){console.error('Service worker registration failed:',error)})})}`;

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => ({ session: await getSessionFn() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Finances" },
      {
        name: "description",
        content: "Controle pessoal de contas, transações, faturas e recorrências.",
      },
      { name: "theme-color", content: "#ffdb00" },
      { name: "application-name", content: "Finances" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icons/icon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      {
        rel: "apple-touch-icon",
        href: "/icons/apple-touch-icon-180.png",
      },
    ],
  }),
  component: Outlet,
  shellComponent: RootDocument,
});
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <Scripts />
        {import.meta.env.PROD && (
          <script dangerouslySetInnerHTML={{ __html: SERVICE_WORKER_SCRIPT }} />
        )}
      </body>
    </html>
  );
}
