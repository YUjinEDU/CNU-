import { School } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export function LoginScreen() {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 space-y-8 bg-slate-50"
    >
      <div className="text-center space-y-4">
        <School className="w-20 h-20 text-primary-container mx-auto" />
        <h2 className="text-4xl font-black text-primary-container tracking-tight">CNU 카풀</h2>
        <p className="text-on-surface-variant text-lg">충남대학교 교직원 전용 카풀 서비스</p>
      </div>

      <button
        onClick={handleLogin}
        className="w-full bg-white text-on-surface py-4 rounded-xl font-bold text-lg shadow-md border border-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
        Google 계정으로 로그인
      </button>
    </motion.div>
  );
}
