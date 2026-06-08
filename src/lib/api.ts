export type ApiUser = {
  id?: number;
  hostName: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "host" | "admin";
  accountStatus?: "active" | "suspended";
  profileImage?: string;
};

export type RegistrationInput = Omit<ApiUser, "role"> & {
  password: string;
  confirmPassword: string;
  inviteCode: string;
};

export type HostInvitationInput = {
  email?: string;
  notes?: string;
  expiresAt?: string;
};

export type HostInvitationRecord = {
  id: number;
  code: string;
  email?: string;
  notes?: string;
  status: "active" | "used" | "expired" | "revoked";
  expires_at?: string;
  used_at?: string;
  revoked_at?: string;
  invited_by?: string;
  used_by?: string;
  created_at?: string;
};

export type StationHostRecord = {
  id: number;
  first_name: string;
  last_name: string;
  host_name?: string;
  email: string;
  account_status: "active" | "suspended";
  shows_count: number;
  audio_count: number;
  joined_at: string;
};

export type TrackInput = {
  id: string;
  audioFileId?: number;
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
  status: "draft" | "scheduled" | "ready" | "submitted";
  scheduledAt?: string;
  fullShowFile?: File | null;
  fullShowDuration?: number;
  audioAuthorized: boolean;
  metadataConfirmed: boolean;
  explicitContentConfirmed: boolean;
  containsExplicitContent: boolean;
  tracks: TrackInput[];
};

export type AudioFileInput = {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration?: number;
  notes?: string;
  kind: "track" | "host_break" | "full_show";
  visibility: "private" | "shared" | "pending_review";
  file: File;
};

export type AudioFileMetadataInput = {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  duration?: number;
  notes?: string;
  visibility?: "private" | "shared" | "pending_review";
  explicit?: boolean;
};

export type AudioFileRecord = {
  id: number;
  user_id?: number;
  name: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration?: number;
  size: number;
  s3_key: string;
  url: string;
  content_type?: string;
  kind: "track" | "host_break" | "full_show";
  visibility: "private" | "shared" | "pending_review";
  explicit?: boolean;
  notes?: string;
  owner_name?: string;
  owned_by_current_user?: boolean;
  created_at?: string;
};

export type PlaylistRecord = {
  id: number;
  user_id: number;
  name: string;
  description: string;
  host_name: string;
  status: "draft" | "submitted" | "needs_edits" | "rejected" | "ready" | "scheduled" | "aired";
  scheduled_at?: string;
  review_notes?: string;
  reviewed_at?: string;
  audio_authorized?: boolean;
  metadata_confirmed?: boolean;
  explicit_content_confirmed?: boolean;
  contains_explicit_content?: boolean;
  confirmations_recorded_at?: string;
  delivery_status: "not_sent" | "queued" | "sent" | "failed";
  delivery_target?: string;
  delivery_reference?: string;
  delivery_manifest?: StreamManifest;
  delivered_at?: string;
  full_show_audio_file?: {
    id?: number;
    name?: string;
    url?: string;
    duration?: number;
  } | null;
  songs: Array<{
    id: number;
    name: string;
    artist: string;
    album: string;
    duration: number;
    position: number;
    file_url?: string;
    file_name?: string;
    audio_file_id?: number;
    audio_file?: {
      id: number;
      name: string;
      title?: string;
      artist?: string;
      url?: string;
      kind?: "track" | "host_break" | "full_show";
      visibility?: "private" | "shared" | "pending_review";
      duration?: number;
    } | null;
  }>;
  created_at?: string;
};

export type StreamManifest = {
  version?: number;
  reference?: string;
  station?: string;
  target?: string;
  generated_at?: string;
  provider?: {
    name?: string;
    mode?: string;
    base_url?: string | null;
    station_id?: string | null;
    station_shortcode?: string | null;
    stream_url?: string | null;
    api_key_configured?: boolean;
    recommended_playlist?: string;
    recommended_media_folder?: string;
    next_steps?: string[];
    api_notes?: string;
  };
  show?: {
    id?: number;
    title?: string;
    description?: string;
    host_name?: string;
    scheduled_at?: string;
    status?: string;
    total_duration_seconds?: number;
    package_mode?: "single_master" | "ordered_assets";
  };
  assets?: Array<{
    position?: number;
    role?: string;
    audio_file_id?: number;
    title?: string;
    artist?: string;
    file_name?: string;
    content_type?: string;
    url?: string;
    s3_key?: string;
  }>;
  playout?: Array<{
    position?: number;
    type?: string;
    title?: string;
    artist?: string;
    duration_seconds?: number;
    start_offset_seconds?: number;
    end_offset_seconds?: number;
    audio_url?: string;
    audio_file_id?: number;
    s3_key?: string;
  }>;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

const xhrRequest = <T>(url: string, method: string, body: FormData, onProgress?: (percent: number) => void) =>
  new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, url);
    request.withCredentials = true;
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      const responseBody = request.response || {};
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve(responseBody as T);
      } else {
        reject(new Error(responseBody?.error || responseBody?.errors?.join?.(", ") || "The backend rejected this request."));
      }
    };
    request.onerror = () => reject(new Error("The upload was interrupted. Check your connection and try again."));
    request.send(body);
  });

const normalizeUser = (payload: any): ApiUser => {
  const attributes = payload?.data?.attributes ?? payload?.attributes ?? payload;

  return {
    id: Number(payload?.data?.id ?? payload?.id ?? attributes?.id),
    hostName: attributes?.host_name ?? attributes?.hostName ?? "",
    description: attributes?.description ?? "",
    firstName: attributes?.first_name ?? attributes?.firstName ?? "",
    lastName: attributes?.last_name ?? attributes?.lastName ?? "",
    email: attributes?.email ?? "",
    phone: attributes?.phone_number ?? attributes?.phone ?? "",
    role: attributes?.role === "admin" ? "admin" : "host",
    accountStatus: attributes?.account_status === "suspended" ? "suspended" : "active",
    profileImage: attributes?.profile_image ?? attributes?.profileImage ?? "/hostpic.jpg",
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

const buildShowFormData = (show: ShowInput) => {
  const formData = new FormData();
  formData.append("playlist[name]", show.title);
  formData.append("playlist[description]", show.description);
  formData.append("playlist[host_name]", show.hostName);
  formData.append("playlist[status]", show.status);
  formData.append("playlist[scheduled_at]", show.scheduledAt || "");
  formData.append("playlist[audio_authorized]", String(show.audioAuthorized));
  formData.append("playlist[metadata_confirmed]", String(show.metadataConfirmed));
  formData.append("playlist[explicit_content_confirmed]", String(show.explicitContentConfirmed));
  formData.append("playlist[contains_explicit_content]", String(show.containsExplicitContent));

  if (show.fullShowFile) {
    formData.append("playlist[full_show_file]", show.fullShowFile);
    if (show.fullShowDuration) formData.append("playlist[full_show_duration]", String(show.fullShowDuration));
  }

  show.tracks.forEach((track, index) => {
    formData.append(`playlist[songs][${index}][name]`, track.title);
    formData.append(`playlist[songs][${index}][artist]`, track.artist);
    formData.append(`playlist[songs][${index}][album]`, track.album || track.details || "Single");
    formData.append(`playlist[songs][${index}][duration]`, track.length || "0");
    formData.append(`playlist[songs][${index}][file_url]`, track.fileUrl || "");
    formData.append(`playlist[songs][${index}][file_name]`, track.fileName || "");
    if (track.audioFileId) {
      formData.append(`playlist[songs][${index}][audio_file_id]`, String(track.audioFileId));
    }
  });

  return formData;
};

export const api = {
  async login(email: string, password: string): Promise<ApiUser> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: { email, password } }),
      credentials: "include",
    });

    return normalizeUser(await handleResponse(response));
  },

  async currentUser(): Promise<ApiUser | null> {
    const response = await fetch(`${API_BASE_URL}/sessions/current`, {
      credentials: "include",
    });

    if (response.status === 401) return null;

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
          invite_code: user.inviteCode,
        },
      }),
      credentials: "include",
    });

    return normalizeUser(await handleResponse(response));
  },

  async listHostInvitations(): Promise<HostInvitationRecord[]> {
    const response = await fetch(`${API_BASE_URL}/host_invitations`, {
      credentials: "include",
    });

    return handleResponse(response);
  },

  async createHostInvitation(input: HostInvitationInput): Promise<HostInvitationRecord> {
    const response = await fetch(`${API_BASE_URL}/host_invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host_invitation: {
          email: input.email,
          notes: input.notes,
          expires_at: input.expiresAt,
        },
      }),
      credentials: "include",
    });

    return handleResponse(response);
  },

  async revokeHostInvitation(id: number): Promise<HostInvitationRecord> {
    const response = await fetch(`${API_BASE_URL}/host_invitations/${id}/revoke`, {
      method: "PATCH",
      credentials: "include",
    });
    return handleResponse(response);
  },

  async listStationHosts(): Promise<StationHostRecord[]> {
    const response = await fetch(`${API_BASE_URL}/station_hosts`, { credentials: "include" });
    return handleResponse(response);
  },

  async setHostStatus(id: number, status: "active" | "suspended"): Promise<StationHostRecord> {
    const action = status === "active" ? "reactivate" : "suspend";
    const response = await fetch(`${API_BASE_URL}/station_hosts/${id}/${action}`, {
      method: "PATCH",
      credentials: "include",
    });
    return handleResponse(response);
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

  async listAudioFiles(scope?: "mine"): Promise<AudioFileRecord[]> {
    const query = scope ? `?scope=${scope}` : "";
    const response = await fetch(`${API_BASE_URL}/audio_files${query}`, {
      credentials: "include",
    });

    return handleResponse(response);
  },

  async uploadAudioFile(input: AudioFileInput, onProgress?: (percent: number) => void): Promise<AudioFileRecord> {
    const formData = new FormData();
    formData.append("audio_file[title]", input.title);
    formData.append("audio_file[name]", input.file.name);
    formData.append("audio_file[artist]", input.artist);
    formData.append("audio_file[album]", input.album || "");
    formData.append("audio_file[genre]", input.genre || "");
    if (typeof input.duration === "number") formData.append("audio_file[duration]", String(input.duration));
    formData.append("audio_file[notes]", input.notes || "");
    formData.append("audio_file[kind]", input.kind);
    formData.append("audio_file[visibility]", input.visibility);
    formData.append("audio_file[file]", input.file);

    return xhrRequest<AudioFileRecord>(`${API_BASE_URL}/audio_files`, "POST", formData, onProgress);
  },

  async updateAudioFileMetadata(id: number, input: AudioFileMetadataInput): Promise<AudioFileRecord> {
    const response = await fetch(`${API_BASE_URL}/audio_files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_file: input }),
      credentials: "include",
    });

    return handleResponse(response);
  },

  async createShow(show: ShowInput, onProgress?: (percent: number) => void): Promise<PlaylistRecord> {
    return xhrRequest<PlaylistRecord>(`${API_BASE_URL}/playlists`, "POST", buildShowFormData(show), onProgress);
  },

  async getShow(id: number): Promise<PlaylistRecord> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}`, {
      credentials: "include",
    });

    return handleResponse(response);
  },

  async updateShow(id: number, show: ShowInput, onProgress?: (percent: number) => void): Promise<PlaylistRecord> {
    return xhrRequest<PlaylistRecord>(`${API_BASE_URL}/playlists/${id}`, "PATCH", buildShowFormData(show), onProgress);
  },

  async requestPasswordReset(email: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/password_resets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await handleResponse(response);
    return body.message;
  },

  async resetPassword(token: string, email: string, password: string, passwordConfirmation: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/password_resets/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, password_confirmation: passwordConfirmation }),
    });
    const body = await handleResponse(response);
    return body.message;
  },

  async listStationShows(): Promise<PlaylistRecord[]> {
    const response = await fetch(`${API_BASE_URL}/playlists?scope=station`, {
      credentials: "include",
    });

    return handleResponse(response);
  },

  async listPublicSchedule(): Promise<PlaylistRecord[]> {
    const response = await fetch(`${API_BASE_URL}/station/schedule`);

    return handleResponse(response);
  },

  async listMyShows(): Promise<PlaylistRecord[]> {
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      credentials: "include",
    });

    return handleResponse(response);
  },

  async markShowReady(id: number): Promise<PlaylistRecord> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}/mark_ready`, {
      method: "PATCH",
      credentials: "include",
    });

    return handleResponse(response);
  },

  async requestShowChanges(id: number, reviewNotes: string): Promise<PlaylistRecord> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}/request_changes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review: { review_notes: reviewNotes } }),
      credentials: "include",
    });

    return handleResponse(response);
  },

  async reopenShowForEdits(id: number, reviewNotes: string): Promise<PlaylistRecord> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}/reopen_for_edits`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review: { review_notes: reviewNotes } }),
      credentials: "include",
    });

    return handleResponse(response);
  },

  async rejectShow(id: number, reviewNotes: string): Promise<PlaylistRecord> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review: { review_notes: reviewNotes } }),
      credentials: "include",
    });

    return handleResponse(response);
  },

  async scheduleShow(id: number, scheduledAt: string): Promise<PlaylistRecord> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}/schedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlist: { scheduled_at: scheduledAt } }),
      credentials: "include",
    });

    return handleResponse(response);
  },

  async deliverShow(id: number, target: string): Promise<PlaylistRecord> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}/deliver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delivery: { target } }),
      credentials: "include",
    });

    return handleResponse(response);
  },
};
