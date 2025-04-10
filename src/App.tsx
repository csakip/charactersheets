import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";
import { supabase } from "./supabase";
import Room from "./Room";
import { User } from "@supabase/supabase-js";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        if (session) {
          setUser(session.user);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className='flex align-items-center justify-content-center min-h-screen'>Loading...</div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path='/auth' element={<AuthPage />} />
        <Route
          path='/*'
          element={isAuthenticated ? <Room user={user} /> : <Navigate to='/auth' replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
