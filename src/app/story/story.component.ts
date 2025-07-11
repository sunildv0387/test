import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-story',
  standalone: true,
  imports: [HeaderComponent, CommonModule],
  templateUrl: './story.component.html',
  styleUrl: './story.component.css'
})
export class StoryComponent {
  libraryMessage: string = '';
  stories: any[] = [];
  isLoading = true;
  errorMessage = '';
  storyDetail: any = null;
  isFollowing: boolean = false;
  userId: number | null = null;
  storyImgPath = 'https://hyperblah.com/funtellocal';
  storyId: number | null = null;
  followerCount: number = 0;
followerUsers: any[] = [];
likedStories: number[] = [];
starArray: string[] = [];

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['login']);
      return;
    }
    this.userId = +userId;

    this.route.paramMap.subscribe(params => {
      const param = params.get('idAndTitle');
      if (param) {
        const id = param.split('-')[0];
        this.storyId = Number(id);
        this.fetchStoryDetail();
        this.fetchStories();
      }
    });
    this.getFollowingUsers();
    this.loadLikedStories();
  }

  


 fetchStoryDetail() {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  });

  this.http.post<{ status: string; data: any }>(
    `https://hyperblah.com/funtellocal/getstorydetails.php?id=${this.storyId}`,
    {},
    { headers }
  ).subscribe({
    next: (response) => {
      if (response.status === 'success' && response.data) {
        this.storyDetail = response.data;

        this.storyDetail.author_id = this.storyDetail.user_id;
        const rating = this.storyDetail.average_rating || 0;
        this.starArray = this.getStarArray(rating);

        console.log('✅ Story Detail:', this.storyDetail);

        this.checkFollowStatus();

        // ✅ Move this here:
        this.getFollowingUsers();
      } else {
        this.errorMessage = 'Story detail not found.';
      }
    },
    error: (error) => {
      console.error('❌ Error fetching story detail:', error);
      this.errorMessage = 'Failed to load story detail.';
    }
  });
}

getStarArray(rating: number): string[] {
  const stars: string[] = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;

  for (let i = 0; i < fullStars; i++) {
    stars.push('full');
  }

  if (hasHalfStar) {
    stars.push('half');
  }

  while (stars.length < 5) {
    stars.push('empty');
  }

  return stars;
}
  getFollowingUsers() {
  if (!this.storyDetail?.author_id) return;

  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  this.http.post<any>(
    'https://hyperblah.com/funtellocal/follow/check_follow.php',
    { following_id: this.storyDetail.author_id },
    { headers: headers, withCredentials: true }
  ).subscribe({
    next: (res) => {
      this.followerUsers = res.followersList || [];
      this.followerCount = res.followerCount || 0;
      console.log("followerCount", this.followerCount)
      console.log('Followers:', this.followerUsers);
    },
    error: (err) => {
      console.error('Failed to load followers', err);
    }
  });
}
addToLibrary(storyId: number) {
  const userId = sessionStorage.getItem('userId');
  if (!userId) return;

  const body = {
    user_id: userId,
    story_id: storyId,
    like_story: true
  };

  this.http.post<any>('https://hyperblah.com/funtellocal/addstory.php', body).subscribe({
    next: (res) => {
      if (res.status === 'success') {
        // ✅ Liked
        this.likedStories.push(storyId);
        this.libraryMessage = 'Story added to library';
      } else if (res.status === 'removed') {
        // ❌ Unliked
        this.likedStories = this.likedStories.filter(id => id !== storyId);
        this.libraryMessage = 'Story removed from library';
      }

      // Optional: auto-hide message
      setTimeout(() => this.libraryMessage = '', 3000);
    },
    error: () => {
      console.error('Library action failed');
    }
  });
}
loadLikedStories() {
  const userId = sessionStorage.getItem('userId');
  if (!userId) return;

  this.http.get<any>(`https://hyperblah.com/funtellocal/allstory.php?action=library&user_id=${userId}`).subscribe({
    next: (res) => {
      if (res.status === 'success') {
        this.likedStories = res.data.map((item: any) => +item.id); // item.id = story_id
        console.log('Liked Stories:', this.likedStories);
      }
    },
    error: (err) => {
      console.error('Failed to load liked stories:', err);
    }
  });
}
  checkFollowStatus() {
    const authorId = this.storyDetail?.author_id;
    if (!this.userId || !authorId || this.userId === authorId) return;

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http.post<any>(
      'https://hyperblah.com/funtellocal/follow/check_follow.php',
      {
        follower_id: this.userId,
        following_id: authorId
      },
      { headers:headers, withCredentials:true }
    ).subscribe({
      next: (res) => {
        this.isFollowing = res.isFollowing;
        console.log('Follow check result:', res);
      },
      error: (err) => {
        console.error('Follow check failed:', err);
      }
    });
  }

  toggleFollow() {
    const authorId = this.storyDetail?.author_id;
    if (!this.userId || !authorId) return;

    const apiUrl = this.isFollowing
      ? 'https://hyperblah.com/funtellocal/follow/unfollow.php'
      : 'https://hyperblah.com/funtellocal/follow/follow.php';

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    const body = {
      follower_id: this.userId,
      following_id: authorId
    };

    this.http.post<any>(apiUrl, body, { headers, withCredentials: true }).subscribe({
      next: (res) => {
        console.log('Follow/Unfollow response:', res);
        this.isFollowing = !this.isFollowing;
      },
      error: (err) => {
        console.error('Follow/Unfollow failed:', err);
      }
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

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    this.http.post<{ status: string; data: any[] }>(
      `https://hyperblah.com/funtellocal/get_user_ep.php?stories_id=${this.storyId}`,
      { user_id: userId },
      { headers }
    ).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
         this.stories = response.data.map(story => {
        const content = story.content || '';
        const wordCount = content.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200); // 200 words per minute
        return {
          ...story,
          wordCount,
          readTime
        };
      });
        } else {
          this.errorMessage = 'Story not found.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching story:', error);
        this.errorMessage = 'Failed to load story.';
        this.isLoading = false;
      }
    });
  }

  goToEdit(story: any) {
    const slug = this.slugify(story.story_title);
    const partId = story.id;
    this.router.navigate(['/story-write', `${partId}-${slug}`]);
  }

  goToCreate() {
    if (!this.stories.length) return;
    const storyId = this.stories[0].stories_id;
    this.router.navigate(['/creat', storyId]);
  }
getTotalReadingTime(): number {
  return this.stories.reduce((sum, story) => sum + (story.readTime || 0), 0);
}
formatTotalReadTime(minutes: number): string {
  if (minutes >= 10080) { // 7 days
    const weeks = Math.floor(minutes / 10080);
    const rem = minutes % 10080;
    return `${weeks} week${weeks > 1 ? 's' : ''}` + (rem > 0 ? ` ${this.formatTotalReadTime(rem)}` : '');
  } else if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const rem = minutes % 1440;
    return `${days} day${days > 1 ? 's' : ''}` + (rem > 0 ? ` ${this.formatTotalReadTime(rem)}` : '');
  } else if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return `${hrs} hr${hrs > 1 ? 's' : ''}` + (rem > 0 ? ` ${rem} min` : '');
  } else {
    return `${minutes} min`;
  }
}
getTotalViews(): number {
  return this.stories.reduce((sum, story) => sum + (story.views || 0), 0);
}
  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with -
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  }
formatCount(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}
  goToSeries(story: any) {
    this.incrementView(story.id).then(() => {
      const id = story.id;
      const title = story.story_title || '';
      const slug = this.slugify(title);
      this.router.navigate(['/series', `${id}-${slug}`]);
    });
  }

  incrementView(contentId: number): Promise<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return new Promise((resolve, reject) => {
      this.http.post(
        'https://hyperblah.com/funtellocal/increment_view.php',
        { content_id: contentId },
        { headers }
      ).subscribe({
        next: () => {
          console.log('View count incremented');
          resolve();
        },
        error: err => {
          console.error('Failed to increment view count', err);
          reject();
        }
      });
    });
  }

  handleChapterClick(index: number, story: any) {
    if (index >= 2) {
      window.open('https://play.google.com/store/apps/details?id=com.yourapp.id', '_blank');
      return;
    }
    this.goToSeries(story);
  }
}
