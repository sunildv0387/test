import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { error } from 'console';

@Component({
  selector: 'app-episode',
  standalone: true,
  imports: [HeaderComponent, CommonModule],
  templateUrl: './episode.component.html',
  styleUrl: './episode.component.css'
})
export class EpisodeComponent {
stories: any[] = [];
  isLoading = true;
  errorMessage = '';
  messageMap: { [key: number]: string } = {};
  storyImgPath = 'https://hyperblah.com/funtellocal';
  storyId: number | null = null;
  constructor(private http: HttpClient, private router:Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    this.router.navigate(['login']);
    return;
  }
const param = this.route.snapshot.paramMap.get('idAndTitle');

  if (param) {
    const id = param.split('-')[0];
    this.storyId = Number(id);
    console.log ('storyId', this.storyId);
  }
  this.fetchStories();
}


  fetchStories() {
  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    this.errorMessage = 'Please login to view your stories';
    this.isLoading = false;
    this.router.navigate(['/login']);
    return;
  }

  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  });

  this.http.post<{status: string, data: any[]}>(
    `https://hyperblah.com/funtellocal/draft_get_ep.php?stories_id=${this.storyId}`,
    { user_id: userId },
    { headers }
  ).subscribe({
  next: (response) => {
    if (response.status === 'success' && response.data) {
      this.stories = response.data;
      console.log('story', this.stories)
    } else {
      this.errorMessage = 'Story not found.';
    }
    this.isLoading = false;
  },
  error: (error) => {
    console.error('Error fetching story:', error);
    this.errorMessage = 'Failed to load story. Please try again later.';
    this.isLoading = false;
  }
});
}
goToEdit(story: any) {
  this.messageMap = {};
  if (story.status === '1') {
    this.messageMap[story.id]  = 'This story has already been published and cannot be edited.';
    return;
  }
  const slug = this.slugify(story.story_title);
  const partId = story.id;
  this.router.navigate(['/story-write', `${partId}-${slug}`]);
}
goToCreate() {
  if (this.storyId) {
    console.log('Navigating to create page with storyId:', this.storyId);
    this.router.navigate(['/creat', this.storyId]); // Match your router path exactly
  } else {
    console.error('No story ID available');
    // Optionally navigate to a fallback route or show an error
    this.router.navigate(['/stories']); // Example fallback
  }
  
}
slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')     // replace spaces and non-word chars with -
    .replace(/^-+|-+$/g, '');       // remove leading/trailing dashes
}
}
