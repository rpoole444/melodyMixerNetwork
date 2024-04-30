import { useState } from "react";
import "../styles/globals.css";
import LoginComponent from "@/components/LoginComponent";
import Link from "next/link";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const handleLoginSuccess = () => {
    console.log("User logged in successfully!");
    setIsLoggedIn(true);
  };

  return (
    <main className="flex w-full min-h-screen items-stretch justify-center">
      {!isLoggedIn ? (
        <>
          <LoginComponent onLoginSuccess={handleLoginSuccess} />
        </>
      ) : (
        <div className="flex w-full h-full">
          <div className="w-1/2 flex flex-col items-center justify-center border-r-8 border-white" style={{ minHeight: '100vh' }}>
            <h2>Host Profile</h2>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">Enter</button>
          </div>
          <div className="w-1/2 flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
            <h2>Create Show</h2>
            <Link href="/CreateShow" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700" >
            Enter
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
