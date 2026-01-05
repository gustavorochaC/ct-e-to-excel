import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/730c0d06-4f93-497d-8fb0-19604a532633',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NotFound.tsx:useEffect',message:'404 error triggered',data:{pathname:location.pathname,search:location.search,hash:location.hash,windowPathname:window.location.pathname,windowHref:window.location.href,viteBase:import.meta.env.BASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
