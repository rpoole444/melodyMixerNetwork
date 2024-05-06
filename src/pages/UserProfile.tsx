import Header from '@/components/Header';
import { useState } from 'react';

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    hostName: 'Poole and the Gang',
    description: 'Enthusiastic music lover and host',
    firstName: 'Reid',
    lastName: 'Poole',
    email: 'reid@example.com',
    phone: '123-456-7890',
    profilePic: '/hostpic.jpg'  // Ensure the path is correct
  });
  const [shows, setShows] = useState([
    { id: 1, title: "Jazz Nights" },
    { id: 2, title: "Classic Rock Hour" },
    { id: 3, title: "Hip Hop Beats" }
    // Add more shows here
  ]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = (e:any) => {
    e.preventDefault();
    console.log('Submitting:', user);
    setIsEditing(false);
    // Normally you would also send this data back to your server
  };

  return (
    <>
    <Header title="Melody Maker Profile" />
      <div className="flex flex-col text-black items-center justify-center min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/path_to_your_background_image.jpg')" }}>
       <div className="flex flex-col md:flex-row items-start bg-toupe bg-opacity-90 mb-40 backdrop-filter items-center justify-center backdrop-blur-lg rounded-lg shadow-lg p-8 w-full max-w-6xl">
        <h1 className="text-center text-white text-4xl">Welcome to your Host Profile, {user.hostName}!!!</h1>
       </div>
      {!isEditing ? (
        <div className="flex flex-col md:flex-row items-start bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg p-8 w-full max-w-6xl">
          <img src={user.profilePic} alt="Profile" className="w-64 h-64 rounded-full object-cover mr-8" />
          <div className="flex-1">
            <h2 className="text-3xl font-bold">{user.hostName}</h2>
            <p className="text-xl">{user.description}</p>
            <div className="text-lg mt-4">
              <p>{`${user.firstName} ${user.lastName}`}</p>
              <p>{user.email}</p>
              <p>{user.phone}</p>
            </div>
            <button onClick={handleEditToggle} className="mt-4 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700">Edit Profile</button>
          </div>
          <div className="w-full md:w-1/3 mt-4 md:mt-0">
            <h3 className="text-xl font-bold mb-2">Your Shows:</h3>
            <ul className="list-disc pl-5">
              {shows.map(show => (
                <li key={show.id} className="bg-gray-300 rounded-lg p-2 my-1">{show.title}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-lg p-8 shadow-lg">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="hostName" value={user.hostName} onChange={handleChange} className="input col-span-2" placeholder="Host Name" />
              <textarea name="description" value={user.description} onChange={handleChange} className="textarea col-span-2" placeholder="Description"></textarea>
              <input type="text" name="firstName" value={user.firstName} onChange={handleChange} className="input" placeholder="First Name" />
              <input type="text" name="lastName" value={user.lastName} onChange={handleChange} className="input" placeholder="Last Name" />
              <input type="email" name="email" value={user.email} onChange={handleChange} className="input" placeholder="Email" />
              <input type="tel" name="phone" value={user.phone} onChange={handleChange} className="input" placeholder="Phone Number" />
              <button type="submit" className="col-span-2 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700">Save</button>
            </div>
            <button onClick={handleEditToggle} className="mt-4 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700">Cancel</button>
          </form>
        )}
      </div>
    </>
  );
};

export default UserProfile;
