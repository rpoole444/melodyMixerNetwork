import { useRouter } from 'next/router';
import { useState } from 'react';

const Header = ({ title }:any) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: "About Melody Mixer Network", link: "/about" },
    { name: "Radio Show Host Guide and Guidelines", link: "/guide" },
    { name: "Personal Host Profile", link: "/UserProfile" },
    { name: "Create a Show", link: "/CreateShow" }
  ];

  return (
    <header className="w-full bg-black text-white flex justify-between items-center px-5 py-3 fixed top-0 left-0 z-50 h-10vh shadow-md">
      <button onClick={() => router.back()} className="flex items-center space-x-2">
        <img src='/arrow-left.png' alt="Back" className="w-4 h-4" />
        <span>Back</span>
      </button>
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <div className="relative">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
          Menu
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg rounded-lg">
            <ul className="text-sm">
              {menuItems.map((item, index) => (
                <li key={index} className="px-4 py-2 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
                  <a href={item.link}>{item.name}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
