import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })  
export class AllapiService {
  private apiUrl = 'https://hyperblah.com/funtellocal/addstory.php';
  private logoutUrl = 'https://hyperblah.com/funtellocal/logout.php';
  private userStory = 'https://hyperblah.com/funtellocal/allstory.php';
  private createStoryApi = 'https://hyperblah.com/funtellocal/createstory.php';

  constructor(private http: HttpClient) {} 

  addStory(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }
  createStory(formData: FormData): Observable<any> {
    return this.http.post(this.createStoryApi, formData);
  }
  logout(){
    return this.http.get(this.logoutUrl).pipe(
      tap(() => {
        // Clear session storage on successful logout
        sessionStorage.clear();
        // Alternatively clear specific items:
         sessionStorage.removeItem('userId');
        // sessionStorage.removeItem('token');
      })
    );
  }
  getUserStories(userId: number): Observable<any> {
    return this.http.get<any>(`${this.userStory}?user_id=${userId}`, {
      withCredentials: true
    });
  }
  
  getStoryById(storyId: number) {
    return this.http.get<any>(`https://hyperblah.com/funtellocal/getstory.php?id=${storyId}`);
  }
  publishStory(formData: FormData) {
  return this.http.post<any>('https://hyperblah.com/funtellocal/publish_story.php', formData);
}
  
  
 updateStory(formData: FormData): Observable<any> {
  console.log('Service sending:', {
    storyId: formData.get('story_id'),
    title: formData.get('story_title'),
    content: formData.get('story_content')
  });
  return this.http.post<any>('https://hyperblah.com/funtellocal/updatestory.php', formData);
}

  
}
