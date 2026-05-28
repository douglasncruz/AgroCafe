const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = {
  async post(endpoint: string, body: any, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao processar a requisição');
    }
    return data;
  },

  async postForm(endpoint: string, formData: FormData, token?: string) {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao processar a requisição');
    return data;
  },

  async putForm(endpoint: string, formData: FormData, token?: string) {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: formData,
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao processar a requisição');
    return data;
  },

  async get(endpoint: string, token: string) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao processar a requisição');
    }
    
    return data;
  },

  async delete(endpoint: string, token: string) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao deletar');
    }
    return data;
  },

  async put(endpoint: string, body: any, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao atualizar os dados');
    }
    return data;
  },

  async patch(endpoint: string, body: any, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao atualizar os dados');
    }
    return data;
  }
};
