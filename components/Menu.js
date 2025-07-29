// components/Menu.js

import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebaseConfig";
import styles from "./Menu.module.css";

export default function Menu() {
  const router = useRouter();

  const logout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  // Lista de páginas (nome, rota)
  const pages = [
    { name: "Início", path: "/" },
    { name: "Admin", path: "/admin" },
    { name: "Alunos", path: "/alunos" },
    { name: "Perfil", path: "/perfil" },
    { name: "Treinos", path: "/treinos" },
    { name: "Meus Treinos", path: "/meus-treinos" },
    { name: "Painel", path: "/painel" },
    { name: "Pagamento", path: "/pagamento" },
  ];

  return (
    <nav className={styles.menuBar}>
      <div className={styles.menuInner}>
        <div className={styles.logoArea}>
          <Link href="/">
            <img src="/img/ghm.jpg" alt="Logo" className={styles.logo} />
          </Link>
          <span className={styles.brand}>Presença Treino</span>
        </div>
        <ul className={styles.links}>
          {pages.map((page) => (
            <li key={page.path}>
              <Link href={page.path}>
                <span className={router.pathname === page.path ? styles.active : ""}>
                  {page.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <button className={styles.logoutBtn} onClick={logout}>Sair</button>
      </div>
    </nav>
  );
}
