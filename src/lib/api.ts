export type ApiUser = {
  id?: number;
  hostName: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
};

export type RegistrationInput = ApiUser & {
  password: string;
  confirmPassword: string;
};

export type TrackInput = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  length: string;
  details?: string;
  fileName?: string;
  fileUrl?: string;
  kind: "upload" | "recording" | "metadata";
};

export type ShowInput = {
  title: string;
  description: string;
  hostName: string;
  status: "draft" | "scheduled" | "ready";
  scheduledAt?: string;
  tracks: TrackInput[];
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

const demoUser: ApiUser = {
  id: 1,
  hostName: "Poole and the Gang",
  description: "Independent radio host building curated sets for Denver listeners.",
  firstName: "Reid",
  lastName: "Poole",
  email: "reid@example.com",
  phone: "123-456-7890",
  profileImage: "/hostpic.jpg",
};

const normalizeUser = (payload: any): ApiUser => {
  const attributes = payload?.data?.attributes ?? payload?.attributes ?? payload;

  return {
    id: Number(payload?.data?.id ?? payload?.id ?? attributes?.id ?? demoUser.id),
    hostName: attributes?.host_name ?? attributes?.hostName ?? demoUser.hostName,
    description: attributes?.description ?? demoUser.description,
    firstName: attributes?.first_name ?? attributes?.firstName ?? demoUser.firstName,
    lastName: attributes?.last_name ?? attributes?.lastName ?? demoUser.lastName,
    email: attributes?.email ?? demoUser.email,
    phone: attributes?.phone_number ?? attributes?.phone ?? demoUser.phone,
    profileImage: attributes?.profile_image ?? attributes?.profileImage ?? demoUser.profileImage,
  };
};

const handleResponse = async (response: Response) => {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.error || body?.errors?.join?.(", ") || "The backend rejected this request.";
    throw new Error(message);
  }

  return body;
};

export const api = {
  demoUser,

  async login(email: string, password: string): Promise<ApiUser> {
    if (email === "demo@melody.test" && password === "demo123") {
      return demoUser;
    }

    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: { email, password } }),
      credentials: "include",
    });

    return normalizeUser(await handleResponse(response));
  },

  async logout() {
    await fetch(`${API_BASE_URL}/sessions`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => undefined);
  },

  async register(user: RegistrationInput): Promise<ApiUser> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: {
          host_name: user.hostName,
          description: user.description,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone_number: user.phone,
          password: user.password,
          password_confirmation: user.confirmPassword,
        },
      }),
      credentials: "include",
    });

    return normalizeUser(await handleResponse(response));
  },

  async updateUser(user: ApiUser): Promise<ApiUser> {
    if (!user.id) return user;

    const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: {
          host_name: user.hostName,
          description: user.description,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone_number: user.phone,
        },
      }),
      credentials: "include",
    });

    return normalizeUser(await handleResponse(response));
  },

  async createShow(show: ShowInput) {
    const payload = {
      playlist: {
        name: show.title,
        description: show.description,
        host_name: show.hostName,
        status: show.status,
        scheduled_at: show.scheduledAt,
        songs: show.tracks.map((track) => ({
          name: track.title,
          artist: track.artist,
          album: track.album || track.details || "Single",
          duration: track.length,
          file_url: track.fileUrl,
          file_name: track.fileName,
        })),
      },
    };

    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    return handleResponse(response);
  },
};
