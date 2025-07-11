import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userId: string | null = null;
  private loginApiUrl = 'https://hyperblah.com/funtellocal/admin.php';
  private getUserApiUrl = 'https://hyperblah.com/funtellocal/get_user.php';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(
      this.loginApiUrl,
      { username, password },
      { withCredentials: true }
    );
  }

  

  getUserDetails(): Observable<any> {
    return this.http.get(this.getUserApiUrl, { withCredentials: true });
  }
  setUserId(id: string) {
    this.userId = id;
  }

  getUserId(): string | null {
    return this.userId;
  }

  
}
