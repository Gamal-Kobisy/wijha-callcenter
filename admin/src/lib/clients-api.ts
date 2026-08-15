import { apiFetch } from "./api";

// --- TYPES ---
export interface ProjectAssignment {
  project_id: number
  project_name: string
  status?: string
  attempt_count?: number
  last_dialed_at?: string | null
}

export interface OwnerPhone {
  phone: string
}

export interface OwnerInfo {
  key: string
  value: string
}

export interface Owner {
  id: number
  name?: string
  type?: string
  next_dial_at?: string | null
  phones?: OwnerPhone[]
  info?: OwnerInfo[]
  projects?: ProjectAssignment[]
}

export interface Agent {
  id: number
  name: string
  email?: string
}

export interface Project {
  id: number
  name: string
  description?: string
}

export interface StatusCount {
  status: string
  count: number
}

export interface CallRecord {
  id: number
  client_id: number
  agent_id: number
  status: string
  time: string
  duration?: number
  agent_notes?: string
  projects?: { id: number; name: string }[]
}

export interface PaginatedOwnersResponse {
  data: Owner[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

// --- HELPERS ---
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// --- REAL API CLIENT ---
export const clientsApi = {
  /**
   * List clients (owners/leads).
   * @param page   Page number (1-indexed)
   * @param limit  Items per page
   * @param type   Filter by Client.type: "OWNER" | "LEAD" | "BOTH" | undefined (all)
   * @param status Filter by ClientProject.status: "dial" | "callback" | etc.
   */
  async getClients(
    page = 1,
    limit = 10,
    type?: string,
    status?: string,
  ): Promise<PaginatedOwnersResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (type) params.set("type", type);
    if (status) params.set("status", status);

    const response = await apiFetch(`owners?${params.toString()}`, { method: "GET" });
    return handleResponse<PaginatedOwnersResponse>(response);
  },

  async updateClient(
    ownerId: number,
    data: { type?: string; next_dial_at?: string | null; phones?: string[] },
  ): Promise<Owner> {
    // API expects phones as array of { phone: string }
    const payload: any = { ...data };
    if (data.phones) {
      payload.phones = data.phones.map((p) => ({ phone: p }));
    }
    const response = await apiFetch(`owners/${ownerId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return handleResponse<Owner>(response);
  },

  async deleteClient(ownerId: string | number): Promise<void> {
    const response = await apiFetch(`owners/${ownerId}`, { method: "DELETE" });
    if (!response.ok && response.status !== 404) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || `Delete failed: ${response.status}`);
    }
  },

  async bulkCreateClients(owners: any[]): Promise<Owner[]> {
    const response = await apiFetch("owners/bulk", {
      method: "POST",
      body: JSON.stringify({ owners }),
    });
    return handleResponse<Owner[]>(response);
  },

  async getStatusCounts(): Promise<StatusCount[]> {
    const response = await apiFetch("owners/statuses", { method: "GET" });
    return handleResponse<StatusCount[]>(response);
  },

  // Agents (Users with role=user)
  async getAgents(): Promise<Agent[]> {
    const response = await apiFetch("users?role=user", { method: "GET" });
    const data = await handleResponse<any[]>(response);
    return data.map((u) => ({
      id: u.id,
      name: u.name || u.email || "Unknown",
      email: u.email,
    }));
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await apiFetch("projects", { method: "GET" });
    return handleResponse<Project[]>(response);
  },

  // Call history for a specific client
  async getClientCallHistory(
    clientId: string | number,
    limit = 50,
  ): Promise<{ data: CallRecord[] }> {
    const params = new URLSearchParams({
      client_id: String(clientId),
      limit: String(limit),
    });
    const response = await apiFetch(`calls?${params.toString()}`, { method: "GET" });
    return handleResponse<{ data: CallRecord[] }>(response);
  },
};

