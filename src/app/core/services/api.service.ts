import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Job {
  id?: string;
  name: string;
  status: 'queued' | 'processing' | 'success' | 'failed' | 'Completed' | 'Pending' | 'New';
  path: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api'; // Proxy should handle this or full URL

  constructor(private http: HttpClient) { }

  upload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.baseUrl}/jobs`);
  }

  getJobStatus(id: string): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.baseUrl}/jobs/${id}/status`);
  }

  download(filename: string): void {
    window.location.href = `${this.baseUrl}/download/${filename}`;
  }
}
