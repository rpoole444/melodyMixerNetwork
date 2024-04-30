import Image from "next/image";
import "../styles/globals.css";
import LoginComponent from "@/components/LoginComponent";

export default function Home() {
  const handleLoginSuccess = () => {
  console.log("User logged in successfully!");
  // Here you can redirect the user or update the state accordingly
};
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1>hello world this is the radio station!</h1>
      <LoginComponent onLoginSuccess={handleLoginSuccess} />
    </main>
  );
}
