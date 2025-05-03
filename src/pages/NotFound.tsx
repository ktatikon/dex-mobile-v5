
import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20 text-white p-4">
      <div className="bg-dex-dark/80 backdrop-blur-lg border border-dex-primary/30 rounded-lg p-8 max-w-md w-full shadow-2xl">
        <h1 className="text-6xl font-bold mb-4 text-center text-dex-accent">404</h1>
        <p className="text-xl text-gray-300 mb-6 text-center">
          The page <span className="text-dex-primary font-semibold">{location.pathname}</span> was not found
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="bg-dex-dark hover:bg-dex-dark/90 border border-dex-primary/50 flex items-center gap-2"
            onClick={goBack}
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
          <Link to="/">
            <Button className="bg-dex-primary hover:bg-dex-primary/90 w-full flex items-center gap-2">
              <Home size={16} />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
