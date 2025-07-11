import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-myworks',
  standalone: true,
  imports: [HeaderComponent, CommonModule],
  templateUrl: './myworks.component.html',
  styleUrl: './myworks.component.css'
})
export class MyworksComponent implements OnInit {
  activeTab: string = 'stories';
  stories: any[] = [];
  isLoading = true;
  errorMessage = '';
  storyImgPath = 'https://hyperblah.com/funtellocal';
  storyId: number | null = null;
storyDetail: any = null;
userDetail: any = null;
followersList: any[] = []
followingList: any[] = []

  constructor(private http: HttpClient, private router: Router,  private route: ActivatedRoute) {}

  ngOnInit(): void {
    
    this.fetchStoryDetail();
    this.fetchUserDetail(); 
  this.route.paramMap.subscribe(params => {
    const param = params.get('idAndTitle');
    if (param) {
      const id = param.split('-')[0];
      this.storyId = Number(id);
      this.fetchStoryDetail();
    }
    this.fetchStories(); // always call this regardless of route
  });
  }

  fetchStories() {
    const userId = sessionStorage.getItem('userId');
    
    if (!userId) {
      this.errorMessage = 'Please login to view your stories';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    
    // Create headers if needed (if your API requires authentication)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('token')}` // if you use tokens
    });

    this.http.post<{status: string, data: any[]}>(
      'https://hyperblah.com/funtellocal/my_works_story_name.php',
      { user_id: userId },
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.stories = response.data;
          console.log(this.stories);
        } else {
          this.errorMessage = 'No stories found';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching stories:', error);
        this.errorMessage = 'Failed to load stories. Please try again later.';
        this.isLoading = false;
      }
    });
  }
 setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  get totalStories(): number {
  return this.stories.length;
}

  isActiveTab(tab: string): boolean {
    return this.activeTab === tab;
  }
  getTabClass(tab: string): string {
    const baseClasses = 'px-4 py-2 font-medium transition-colors';
    if (this.isActiveTab(tab)) {
      return `${baseClasses} text-wattpad-primary border-b-2 border-wattpad-primary`;
    } else {
      return `${baseClasses} text-wattpad-light hover:text-wattpad-primary`;
    }
  }
  continueWriting(storyId: string, title: string) {
  const slug = this.slugify(title);
  this.router.navigate(['/episode', `${storyId}-${slug}`]);
}
fetchStoryDetail() {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  });

  this.http.post<{ status: string, data: any }>(
    `https://hyperblah.com/funtellocal/getstorydetails.php?id=${this.storyId}`,
    {},
    { headers }
  ).subscribe({
    next: (response) => {
      if (response.status === 'success' && response.data) {
        this.storyDetail = response.data;
        console.log('Story Detail:', this.storyDetail);
      } else {
        this.errorMessage = 'Story detail not found.';
      }
    },
    error: (error) => {
      console.error('Error fetching story detail:', error);
      this.errorMessage = 'Failed to load story detail.';
    }
  });
}
fetchUserDetail() {
  const userId = sessionStorage.getItem('userId');
  if (!userId) return;

  this.http.get<{ status: string, data: any[] }>('https://hyperblah.com/funtellocal/getuserdetail.php')
    .subscribe({
      next: (res) => {
        if (res.status === 'success') {
          const matchedUser = res.data.find(u => u.id == userId);
          if (matchedUser) {
            this.userDetail = matchedUser;
            console.log('Logged-in User:', this.userDetail);

            // ✅ Call fetchFollowData only after userDetail is set
            this.fetchFollowData();
          } else {
            this.errorMessage = 'User not found';
          }
        } else {
          this.errorMessage = 'Failed to load user';
        }
      },
      error: () => {
        this.errorMessage = 'Error fetching user info';
      }
    });
}
slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')     // replace spaces and non-word chars with -
    .replace(/^-+|-+$/g, '');       // remove leading/trailing dashes
}
getJoinedMonthYear(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString.replace(' ', 'T')); // Handles 'YYYY-MM-DD HH:mm:ss'
  const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
  return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
}
fetchFollowData() {
  const userId = sessionStorage.getItem('userId');
  if (!userId) return;
const loggedInUserId = sessionStorage.getItem('userId');  // जो login किया है
const profileUserId = this.userDetail?.id;


  this.http.post<any>('https://hyperblah.com/funtellocal/follow/check_follow.php', {
  follower_id: loggedInUserId,
  following_id: profileUserId
}).subscribe({
  next: (res) => {
    if (res.status === 'success') {
      // ✅ FIXED KEY NAMES
      this.followingList = res.followingList || [];
      this.followersList = res.followersList || [];
    }
  },
  error: () => {
    console.error('Error loading follow data');
  }
});
}
}