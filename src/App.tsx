import { useEffect, useState } from "react";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";
import { supabase } from "./supabase";
import Room from "./Room";
import { User } from "@supabase/supabase-js";
import Rooms from "./Rooms";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
        } else {
          setUser(undefined);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? session.user : undefined);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className='flex align-items-center justify-content-center min-h-screen'>...</div>;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path='auth' element={<AuthPage />} />
        <Route path='/*' element={user ? <Rooms user={user} /> : <Navigate to='auth' replace />} />
        <Route
          path='/:roomId/*'
          element={user ? <Room user={user} /> : <Navigate to='auth' replace />}
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
