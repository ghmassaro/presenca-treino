import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '@/lib/firebaseConfig';
import styles from './Menu.module.css';
import { useState, useEffect } from 'react';

export default function Menu() {
  const router = useRouter();
  const [show, setShow] = useState(true);
  const [lastY, setLastY] = useState(0);

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

  const pages = [
    { name: 'Início', path: '/' },
    { name: 'Admin', path: '/admin' },
    { name: 'Alunos', path: '/alunos' },
    { name: 'Perfil', path: '/perfil' },
    { name: 'Treinos', path: '/treinos' },
    { name: 'Meus Treinos', path: '/meus-treinos' },
    { name: 'Painel', path: '/painel' },
    { name: 'Pagamento', path: '/pagamento' },
  ];

  return (
    <nav className={`${styles.menuBar} ${show ? '' : styles.hidden}`}>
      <div className={styles.menuInner}>
        <Link href="/" className={styles.logoArea}>
          <img src="/img/logo.png" alt="Logo" className={styles.logo} />
        </Link>
        <ul className={styles.links}>
          {pages.map(p => {
            const active = router.pathname === p.path;
            return (
              <li key={p.path}>
                <Link
                  href={p.path}
                  className={`${styles.link} ${active ? styles.linkActive : ''}`}
                >
                  {p.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <button className={styles.logoutBtn} onClick={logout}>
          Sair
        </button>
      </div>
    </nav>
  );
}
