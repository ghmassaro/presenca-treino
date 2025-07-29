import '../styles/globals.css';

import dynamic from "next/dynamic";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseConfig";
import { useRouter } from "next/router";
import { useEffect } from "react";

// Importa o Menu só no client-side para evitar erro em build
const Menu = dynamic(() => import("@/components/Menu"), { ssr: false });

export default function App({ Component, pageProps }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // Protege as páginas (exceto login)
  useEffect(() => {
    if (!loading && !user && router.pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="p-8 text-center text-lg">Carregando...</div>;
  }

  // Menu só nas páginas que não são login
  if (router.pathname === "/login") {
    return <Component {...pageProps} user={user} />;
  }

  return (
    <>
      <Menu />
      <Component {...pageProps} user={user} />
    </>
  );
}
