import "../styles/globals.css";
import LoginComponent from "@/components/LoginComponent";
import Link from "next/link";
import Header from "@/components/Header";
import { useUser } from '@/contexts/UserContext';

export default function Home() {
  const { user } = useUser();
  const isLoggedIn = !!user;

  const handleLoginSuccess = () => {
    console.log("User logged in successfully!");
  };

  return (
    <main className="flex w-full min-h-screen items-stretch justify-center">
      {!isLoggedIn ? (
        <div className="flex justify-center items-center flex-col w-full">
          <div className="bg-black bg-opacity-70 p-5 rounded">
            <h1 className="text-3xl font-bold text-white">Welcome to Melody Mixers Network</h1>
          </div>
          <div className="bg-black bg-opacity-70 p-5 rounded mt-10">
            <h1 className="text-3xl font-bold text-white">Login</h1>
          </div>
          <LoginComponent onLoginSuccess={handleLoginSuccess} />
        </div>
      ) : (
        <>
          <Header title="Melody Mixer Network" />
          <div className="flex flex-col w-full min-h-screen bg-cover" style={{ backgroundImage: "url('/path_to_your_background_image.jpg')" }}>
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="bg-black bg-opacity-80 rounded-lg shadow-lg text-center max-w-lg h-1/2 mx-auto">
                <h2 className="text-3xl font-bold mb-4 mt-7">Host Profile</h2>
                <p className="mb-10">View and edit your hosting profile, manage your bio, contact details, and show listings.</p>
                <Link href="/UserProfile" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
                  Enter
                </Link>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="bg-black bg-opacity-80 rounded-lg shadow-lg text-center h-1/2 max-w-lg mx-auto">
                <h2 className="text-3xl font-bold mb-4 mt-7">Create Show</h2>
                <p className="mb-10">Craft new shows, manage existing ones, and control broadcast settings all from here.</p>
                <Link href="/CreateShow" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
                  Enter
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
