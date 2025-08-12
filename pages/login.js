import { useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import styles from "../styles/login.module.css";

export default function Login() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/admin");
    }
  }, [user, loading, router]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // O useEffect já faz o redirect quando user existir
    } catch (error) {
      alert("Erro ao fazer login: " + error.message);
      console.error(error);
    }
  };

  return (
    <div className={styles.loginBg}>
      <div className={styles.loginCard}>
        <img src="/img/ghm.jpg" alt="Logo" className={styles.loginLogo} />
        <h1 className={styles.loginTitle}>Acessar Treinos</h1>
        <div className={styles.loginDesc}>Use sua conta Google para continuar</div>
        <button className={styles.loginBtn} onClick={login} disabled={loading}>
          {loading ? "Carregando..." : "Login com Google"}
        </button>
      </div>
    </div>
  );
}
