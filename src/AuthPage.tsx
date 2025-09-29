import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else {
        setMessage("A bejelentkezés sikeres!");
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else {
        setMessage("A regisztráció sikeres!");
        navigate("/");
      }
    }
  };

  function loginWithOTP() {
    if (!email.trim()) {
      setMessage("Email kötelező!");
    } else {
      supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
      setMessage("Email küldés sikeres. Bezárhatod ezt a lapot.");
    }
  }

  return (
    <div className='flex align-items-center justify-content-center min-h-screen bg-black-alpha-90 p-4'>
      <Card title={isLogin ? "Bejelentkezés" : "Regisztráció"} className='w-full md:w-30rem shadow-8 border-round-xl'>
        <div className='flex flex-column gap-4'>
          <div className='p-fluid'>
            <span className='p-float-label mb-5 mt-2'>
              <InputText id='email' value={email} onChange={(e) => setEmail(e.target.value)} className='p-inputtext-lg' required />
              <label htmlFor='email'>Email</label>
            </span>

            <span className='p-float-label'>
              <Password
                id='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                feedback={!isLogin}
                toggleMask
                className='p-inputtext-lg'
                inputClassName='w-full'
              />
              <label htmlFor='password'>Jelszó</label>
            </span>

            {!isLogin && <p className='my-2 text-300 text-sm'>Kisbetű, nagybetű, szám kell.</p>}
          </div>

          {message && <Message severity={message.includes("sikeres") ? "success" : "error"} text={message} className='w-full border-round-xl' />}

          <Button label={isLogin ? "Bejelentkezés" : "Regisztráció"} onClick={handleAuth} size='large' className='p-button-raised mt-2' />

          {isLogin && <Button label={"Belépés emailes linkkel"} onClick={() => loginWithOTP()} severity='secondary' size='large' />}

          <div className='flex align-items-center gap-2'>
            <Divider className='flex-1' />
            <span className='text-500 font-light'>VAGY</span>
            <Divider className='flex-1' />
          </div>

          <Button label={isLogin ? "Fiók létrehozása" : "Vissza a bejelentkezéshez"} onClick={() => setIsLogin(!isLogin)} severity='secondary' text size='large' />
        </div>
      </Card>
    </div>
  );
}

export default AuthPage;
