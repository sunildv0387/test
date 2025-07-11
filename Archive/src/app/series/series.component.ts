import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AllapiService } from '../allapi.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommentSectionComponent } from '../comment-section/comment-section.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-series',
  standalone: true,
  imports: [HeaderComponent, CommonModule, CommentSectionComponent],
  templateUrl: './series.component.html',
  styleUrl: './series.component.css'
})
export class SeriesComponent implements OnInit {
  storyId: number | null = null;
  storyContent: any = null;
  storyDetail: any = {}; // for author/story data
  currentUser: any = null; // ✅ separate user data
  allParts: any[] = [];
  isLoading = true;
  errorMessage = '';
  scrollProgress = '0%';
  partsLoaded = false;
  isSpeaking = false;
  isFullscreen = false;
  userId: number | null = null;
  private followStatusChecked = true;
   
    followerCount: number = 0;
followerUsers: any[] = [];

  fontSize = 1;
  readerMode: 'light' | 'dark' | 'reading' = 'light';
  isFollowing: boolean = false;
  userRating: number = 0;
averageRating: number = 0;
totalRatings: number = 0;

  @ViewChild('storyContentBox') storyContentDiv!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: AllapiService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    
    const uid = sessionStorage.getItem('userId');
    if (!uid) {
      this.router.navigate(['/login']);
      return;
    }
    this.userId = +uid;

    this.route.paramMap.subscribe(params => {
      const param = params.get('idAndTitle');
      if (param) {
        const id = Number(param.split('-')[0]);
        this.storyId = id;
        this.loadStory();
        
      }
    });
    
  }
loadRatings() {
  if (!this.storyId) return;

  this.http.post<any>(
    'https://hyperblah.com/funtellocal/get_rating.php',
    { story_id: this.storyId, user_id: this.userId },
    { headers: { 'Content-Type': 'application/json' } }
  ).subscribe({
    next: (res) => {
      this.userRating = res.user_rating || 0;
      this.averageRating = res.average_rating || 0;
      this.totalRatings = res.total_ratings || 0;
      
    },
    error: (err) => {
      console.error('Rating load failed', err);
    }
  });
}
submitRating(star: number) {
  if (!this.userId || !this.storyId) return;

  this.http.post<any>(
    'https://hyperblah.com/funtellocal/save_rating.php',
    { story_id: this.storyId, user_id: this.userId, rating: star },
    { headers: { 'Content-Type': 'application/json' } }
  ).subscribe({
    next: (res) => {
      this.userRating = star;
      console.log("userRating", res)
      this.loadRatings(); // Refresh average & count
    },
    
    error: (err) => {
      console.error('Rating submit failed', err);
    }
  });
}
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    document.body.style.overflow = this.isFullscreen ? 'hidden' : '';
  }

  changeReaderMode(mode: 'light' | 'dark' | 'reading'): void {
    this.readerMode = mode;
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

  
fetchStoryDetail(storiesId: number) {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  });

  this.http.post<{ status: string; data: any }>(
    `https://hyperblah.com/funtellocal/getstorydetails.php?id=${storiesId}`,
    {},
    { headers, withCredentials: true }
  ).subscribe({
    next: (response) => {
      if (response.status === 'success' && response.data) {
        this.storyDetail = response.data;
        this.storyDetail.author_id = this.storyDetail.user_id;
        this.checkFollowStatus();
this.getFollowingUsers();
        console.log('✅ Story Detail (main):', this.storyDetail);
        this.checkFollowStatus();
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
  loadStory(): void {
  if (!this.storyId) return;

  this.contentService.getStoryById(this.storyId).subscribe({
    next: (response: any) => {
      if (response.status === 'success' && response.data) {
        this.storyContent = {
          title: response.data.story_title,
          description: response.data.description,
          content: response.data.content,
          date: response.data.date || response.data.created_at || '',
          user_id: response.data.user_id,
          videolink: response.data.video_link
        };

        const storiesId = response.data.stories_id;

        if (storiesId) {
          this.loadAllParts(storiesId);
          this.fetchStoryDetail(storiesId);
        }

        // ✅ Load the rating AFTER setting storyId
        this.loadRatings(); // 👈 Add this line here
      } else {
        this.errorMessage = 'Story not found';
      }
      this.isLoading = false;
    },
    error: (err) => {
      console.error('❌ Error loading story:', err);
      this.errorMessage = 'Error loading story.';
      this.isLoading = false;
    }
  });
}


getSafeVideoUrl(url: string): SafeResourceUrl | null {
  if (!url) return null;

  // YouTube long format
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

  // YouTube short format
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1];
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

  // Vimeo
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1];
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${videoId}`);
  }

  // fallback (assume it's already embed-safe)
  return this.sanitizer.bypassSecurityTrustResourceUrl(url);
}


  loadAllParts(storiesId: number): void {
  const apiUrl = `https://hyperblah.com/funtellocal/get_user_ep.php?stories_id=${storiesId}`;
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  });

  this.http.post<{ status: string, data: any[] }>(
    apiUrl,
    { user_id: sessionStorage.getItem('userId') },
    { headers }
  ).subscribe({
    next: (res) => {
      if (res.status === 'success' && res.data) {
        this.allParts = res.data.filter(p => p.status == 1).sort((a, b) => a.id - b.id);
        this.partsLoaded = true;

        // ✅ Check if current part is last part
        const currentIndex = this.allParts.findIndex(p => p.id == this.storyId);
        const currentPart = this.allParts[currentIndex];

        if (currentPart) {
          const isLastPart = currentIndex === this.allParts.length - 1;

          // ✅ Update read progress if it's the last part
          this.storeReadProgress(
            storiesId,
            currentPart.id,
            this.allParts.length,
            currentPart.story_title
          );
        }
      }
    },
    error: (err) => {
      console.error('❌ Error loading parts:', err);
      this.allParts = [];
      this.partsLoaded = true;
    }
  });
}
checkFollowStatus(): void {
  const authorId = this.storyDetail?.author_id;
  if (!this.userId || !authorId || this.userId === authorId) {
    console.log('🟡 checkFollowStatus: invalid userId or authorId or same user');
    return;
  }

  console.log('🔄 Sending follow check:', this.userId, '→', authorId);

  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  this.http.post<any>(
    'https://hyperblah.com/funtellocal/follow/check_follow.php',
    {
      follower_id: this.userId,
      following_id: authorId
    },
    { headers, withCredentials: true }
  ).subscribe({
    next: (res) => {
      this.isFollowing = res.isFollowing;
      console.log('✅ Follow check result:', res);
    },
    error: (err) => {
      console.error('❌ Follow check failed:', err);
    }
  });
}

  toggleFollow(): void {
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
        console.log('✅ Follow/Unfollow response:', res);
        this.isFollowing = !this.isFollowing;
      },
      error: (err) => {
        console.error('❌ Follow/Unfollow failed:', err);
      }
    });
  }
  continueToNextPart(): void {
  const currentIndex = this.allParts.findIndex(part => part.id == this.storyId);
  if (currentIndex !== -1 && currentIndex < this.allParts.length - 1) {
    const nextPart = this.allParts[currentIndex + 1];

    if (currentIndex + 1 >= 2) {
      window.open('https://play.google.com/store/apps/details?id=com.yourapp.id', '_blank');
      return;
    }

    // ✅ Must be BEFORE navigation
    this.storeReadProgress(
      this.storyDetail.id,
      nextPart.id,
      this.allParts.length,
      nextPart.story_title
    );

    console.log('✅ Values before calling storeReadProgress:', {
  storyId: this.storyDetail?.id,
  nextPartId: nextPart?.id,
  title: nextPart?.story_title
});
    // 👇 Now go to next part
    const slug = this.slugify(nextPart.story_title || 'story');
    this.router.navigate(['/series', `${nextPart.id}-${slug}`]);
    setTimeout(() => window.location.reload(), 100);
  } else {
    alert('✅ You are already on the last part.');
  }
}

  isLastPart(): boolean {
    if (!this.partsLoaded || !this.storyId || !this.allParts.length) return true;
    const currentIndex = this.allParts.findIndex(part => part.id == this.storyId);
    return currentIndex === -1 || currentIndex === this.allParts.length - 1;
  }

  isButtonDisabled(): boolean {
    return !this.partsLoaded || this.isLastPart();
  }

  slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
  }
shareOnFacebook(event: Event): void {
  event.preventDefault();
  if (!this.storyContent || !this.storyDetail) {
    alert('Story data not loaded yet.');
    return;
  }
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=https://artypantss.com/social/facebook.php?id=${this.storyId}`;
  window.open(fbShareUrl, '_blank', 'width=600,height=400');
}
shareOnTwitter(): void {
  if (!this.storyContent) return;
  const title = encodeURIComponent(this.storyContent.title);
  const url = encodeURIComponent(`https://artypantss.com/facebook.php?id=${this.storyId}`);
  const twitterUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
  window.open(twitterUrl, '_blank', 'width=600,height=400');
}

shareOnPinterest(): void {
  if (!this.storyContent || !this.storyDetail) return;
  const media = encodeURIComponent(`https://hyperblah.com/funtellocal/${this.storyDetail.user_id}/${this.storyDetail.story_image}`);
  const description = encodeURIComponent(this.storyContent.title);
  const url = encodeURIComponent(`https://artypantss.com/facebook.php?id=${this.storyId}`);
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`;
  window.open(pinterestUrl, '_blank', 'width=700,height=500');
}

shareOnTumblr(): void {
  if (!this.storyContent) return;
  const title = encodeURIComponent(this.storyContent.title);
  const caption = encodeURIComponent(this.storyContent.description);
  const url = encodeURIComponent(`https://artypantss.com/facebook.php?id=${this.storyId}`);
  const tumblrUrl = `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${url}&title=${title}&caption=${caption}`;
  window.open(tumblrUrl, '_blank', 'width=600,height=500');
}
adjustFontSize(action: 'increase' | 'decrease'): void {
  if (action === 'increase' && this.fontSize < 1.5) {
    this.fontSize += 0.1;
  } else if (action === 'decrease' && this.fontSize > 0.8) {
    this.fontSize -= 0.1;
  }
}

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (scrollTop / docHeight) * 100;
    this.scrollProgress = `${scrolled}%`;
  }
  formatCount(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}
storeReadProgress(storyId: number, partId: number, totalParts: number, partTitle: string): void {
  console.log('📌 Storing progress for:', { storyId, partId, totalParts, partTitle }); 
  const userId = sessionStorage.getItem('userId');
  if (!userId) return;

  const key = `story_progress_${userId}`;
  const progressData = JSON.parse(localStorage.getItem(key) || '{}');

  if (!progressData[storyId]) {
    progressData[storyId] = {
      lastReadPartId: partId,
      readParts: [partId],
      totalParts: totalParts,
      lastPartTitle: partTitle,
      timestamp: Date.now()
    };
  } else {
    const entry = progressData[storyId];
    entry.lastReadPartId = partId;
    entry.lastPartTitle = partTitle;
    entry.timestamp = Date.now();
    if (!entry.readParts.includes(partId)) {
      entry.readParts.push(partId);
    }
  }

  localStorage.setItem(key, JSON.stringify(progressData));
}
}
