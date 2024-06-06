const baseURL = 'http://localhost:3000/api/v1';

export const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Something went wrong');
  }
  return response.json();
};

export const getUser = async (id) => {
  const response = await fetch(`${baseURL}/users/${id}`, {
    credentials: 'include',
  });
  return handleResponse(response);
};

export const createUser = async (user) => {
  const response = await fetch(`${baseURL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: {
        host_name: user.hostName,
        description: user.description,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone_number: user.phone,
        password: user.password,
        password_confirmation: user.confirmPassword
      }
    }),
    credentials: 'include',
  });
  return handleResponse(response);
};




export const loginUser = async (email, password) => {
  const response = await fetch(`${baseURL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session: { email, password } }),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const logoutUser = async () => {
  const response = await fetch(`${baseURL}/logout`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(response);
};
