import { JSX, useEffect, useState } from "react";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";
import { supabase } from "./supabase";
import Room from "./Room";
import { User } from "@supabase/supabase-js";
import Rooms from "./Rooms";
import { useStore } from "./store";

function App() {
  const [loading, setLoading] = useState(true);
  const user = useStore((state) => state.user);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          useStore.setState({ user: session.user });
        } else {
          useStore.setState({ user: undefined });
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      useStore.setState({ user: session?.user ?? undefined });
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
        <Route path='/auth' element={<AuthPage />} />
        <Route
          path='/'
          element={
            <RequireAuth user={user}>
              <Rooms />
            </RequireAuth>
          }
        />
        <Route
          path='/:roomId'
          element={
            <RequireAuth user={user}>
              <Room />
            </RequireAuth>
          }
        />
      </Routes>
    </HashRouter>
  );
}

function RequireAuth({ user, children }: { user?: User; children: JSX.Element }) {
  if (!user) {
    return <Navigate to='/auth' replace />;
  }
  return children;
}

export default App;
