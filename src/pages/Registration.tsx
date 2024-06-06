import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import { createUser } from './api/route';
import "../styles/globals.css";

interface User {
  hostName: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const RegistrationPage = () => {
  const [user, setUser] = useState<User>({
    hostName: '',
    description: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await createUser(user);
        setSuccessMessage('Registration successful!');
        console.log('User registration data:', response);

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } catch (error) {
        console.error('Error during registration:', error);
        setErrors({ submit: 'Registration failed. Please try again.' });
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    let errors = {
      email: "",
      password: ""
    };

    if (user.password !== user.confirmPassword) {
      errors.password = "Passwords do not match";
      isValid = false;
    }
    if (user.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
      isValid = false;
    }
    if (!user.email.includes('@')) {
      errors.email = "Invalid email address";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  return (
    <>
      <Header title="Melody Maker Network Registration" />
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-black">
        <form onSubmit={handleSubmit} className="bg-gray-200 p-10 shadow-lg rounded-lg w-full max-w-3xl space-y-6">
          <h2 className="text-center text-3xl font-bold mb-6">Register</h2>

          {successMessage && (
            <div className="text-green-500 text-center mb-6">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="hostName" className="block text-sm font-bold mb-2">Host Name</label>
              <input type="text" name="hostName" id="hostName" value={user.hostName} onChange={handleChange} placeholder="Host Name" className="form-input" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-bold mb-2">Description</label>
              <textarea name="description" id="description" value={user.description} onChange={handleChange} placeholder="Description" className="form-textarea h-24" />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-bold mb-2">First Name</label>
              <input type="text" name="firstName" id="firstName" value={user.firstName} onChange={handleChange} placeholder="First Name" className="form-input" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-bold mb-2">Last Name</label>
              <input type="text" name="lastName" id="lastName" value={user.lastName} onChange={handleChange} placeholder="Last Name" className="form-input" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-2">Email</label>
              <input type="email" name="email" id="email" value={user.email} onChange={handleChange} placeholder="Email" className="form-input" />
              {errors.email && <p className="text-red-500 text-xs italic">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-bold mb-2">Phone Number</label>
              <input type="tel" name="phone" id="phone" value={user.phone} onChange={handleChange} placeholder="Phone Number" className="form-input" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold mb-2">Create Password</label>
              <input type="password" name="password" id="password" value={user.password} onChange={handleChange} placeholder="Create Password" className="form-input" />
              {errors.password && <p className="text-red-500 text-xs italic">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold mb-2">Confirm Password</label>
              <input type="password" name="confirmPassword" id="confirmPassword" value={user.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="form-input" />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Register
          </button>
        </form>
      </div>
    </>
  );
};

export default RegistrationPage;
