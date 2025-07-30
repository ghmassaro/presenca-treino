// pages/_app.js

// 1) Bootstrap primeiro
import 'bootstrap/dist/css/bootstrap.min.css';
// 2) Seu globals com as variáveis tem que vir depois
import '../styles/globals.css';

import dynamic from 'next/dynamic';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Carrega menu só no client
const Menu = dynamic(() => import('@/components/Menu'), { ssr: false });

export default function App({ Component, pageProps }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="p-8 text-center text-lg">Carregando...</div>;
  }

  // Não mostra menu na tela de login
  if (router.pathname === '/login') {
    return <Component {...pageProps} user={user} />;
  }

  return (
    <>
      <Menu />
      <Component {...pageProps} user={user} />
    </>
  );
}
