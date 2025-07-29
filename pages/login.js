import { useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";

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
    <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{
        maxWidth: 340,
        width: "100%",
        textAlign: "center",
        padding: "36px 24px",
        boxShadow: "0 3px 16px rgba(0,0,0,0.08)",
        borderRadius: "18px"
      }}>
        <img src="/img/ghm.jpg" alt="Logo" style={{
          width: 80,
          height: 80,
          objectFit: "cover",
          borderRadius: "50%",
          marginBottom: 18,
          border: "2px solid #f08a4b"
        }} />
        <h1 style={{
          fontFamily: "Montserrat, Arial, sans-serif",
          color: "#f08a4b",
          fontWeight: 700,
          marginBottom: 10,
          fontSize: "1.48rem"
        }}>Acessar Treinos</h1>
        <div style={{
          color: "#666",
          fontSize: "1.03rem",
          marginBottom: 20
        }}>
          Use sua conta Google para continuar
        </div>
        <button
          className="button success"
          onClick={login}
          disabled={loading}
          style={{
            width: "100%",
            fontSize: "1.05rem",
            padding: "12px 0",
            marginTop: 10,
            borderRadius: "8px"
          }}
        >
          {loading ? "Carregando..." : "Login com Google"}
        </button>
      </div>
    </div>
  );
}
