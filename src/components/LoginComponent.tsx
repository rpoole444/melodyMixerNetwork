import { useState, FormEvent } from 'react';
import { useMutation } from 'react-query';

interface LoginComponentProps {
  onLoginSuccess: () => void;
}

const LoginComponent: React.FC<LoginComponentProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Define the mutation for the login process
  const loginMutation = useMutation(async () => {

    onLoginSuccess()
    // Simulate a login API call
  //   const response = await fetch('/api/login', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ email, password }),
  //   });

  //   if (!response.ok) throw new Error('Login failed');

  //   return response.json();
  // }, {
  //   onSuccess: (data) => {
  //     console.log('Login successful:', data);
  //     onLoginSuccess();
  //   },
  //   onError: (error: Error) => {
  //     alert(error.message);
  //   }
  });

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate(); // Trigger the mutation
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex flex-col h-1/3 w-1/2 justify-center items-center ">
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-black text-sm font-bold mb-2" htmlFor="username">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black"
            id="username"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="block text-black text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black mb-3"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-dark text-white font-bold py-2 px-4 rounded"
            type="submit"
            disabled={loginMutation.isLoading}
          >
            Sign In
          </button>
        </div>
          <a
            className="inline-block align-baseline font-bold text-sm text-black hover:text-blue-darker"
            href="/forgot-password"
          >
            Forgot Password?
          </a>
        <p className="mt-4 text-black">
          Need an account? <a href="/register" className="text-blue-500 hover:text-blue-700">Register</a>
        </p>
      </form>
    </div>
  );
};

export default LoginComponent;
