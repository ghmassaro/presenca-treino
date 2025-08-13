import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '@/lib/firebaseConfig';
import styles from './Menu.module.css';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function Menu() {
  const router = useRouter();
  const [show, setShow] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user] = useAuthState(auth);
  const ADMIN_EMAIL = 'gustavohmassaro@gmail.com';

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setShow(currentY < lastY || currentY < 50);
      setLastY(currentY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastY]);

  const logout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const basePages = [
    { name: 'Agenda', path: '/' },
    { name: 'Perfil', path: '/perfil' },
    { name: 'Meus Treinos', path: '/meus-treinos' },
    { name: 'Ranking', path: '/ranking' },
  ];

  const adminPages = [
    { name: 'Painel do Professor', path: '/painel-professor' },
    { name: 'Alunos', path: '/alunos' },
    { name: 'Painel', path: '/painel' },
    { name: 'Pagamento', path: '/pagamento' },
  ];

  const pages = user && user.email === ADMIN_EMAIL
    ? [...basePages, ...adminPages]
    : basePages;

  return (
    <nav className={`${styles.menuBar} ${show ? '' : styles.hidden}`}>
      <div className={styles.menuInner}>
        <Link href="/" className={styles.logoArea}>
          <img src="/img/logo.png" alt="Logo" className={styles.logo} />
        </Link>
        <button
          className={styles.mobileToggle}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          ☰
        </button>
        <ul className={`${styles.links} ${mobileOpen ? styles.open : ''}`}>
          {pages.map(p => {
            const active = router.pathname === p.path;
            return (
              <li key={p.path}>
                <Link
                  href={p.path}
                  className={`${styles.link} ${active ? styles.linkActive : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {p.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          className={`${styles.logoutBtn} ${mobileOpen ? styles.open : ''}`}
          onClick={logout}
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
