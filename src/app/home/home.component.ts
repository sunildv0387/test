import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { AllapiService } from '../allapi.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent  {
  stories: any[] = [];
  libraryMessage: string = '';
  categoryColumns: any = [];
  likedStories: number[] = [];
  userId: string | null = null;
  storyImgPath = 'https://hyperblah.com/funtellocal';
  userProgress: any[] = [];
 topAuthors: {
  author_name: string;
  user_id: string;
  views: number;
  story_count: number;
}[] = [];
isFollowingMap: { [authorId: string]: boolean } = {};
latestStories: any[] = [];
  constructor(private allApi: AllapiService, private http: HttpClient, private router: Router) { }
  
@ViewChild('carousel') carousel!: ElementRef<HTMLDivElement>;
  
  currentSlideIndex = 0;
  slideWidth = 0;

  ngAfterViewInit() {
    this.calculateSlideWidth();
    this.setupCarousel();
  }

  @HostListener('window:resize')
  onResize() {
    this.calculateSlideWidth();
  }

  calculateSlideWidth() {
    if (this.carousel?.nativeElement?.firstElementChild) {
      this.slideWidth = this.carousel.nativeElement.firstElementChild.clientWidth;
    }
  }

  setupCarousel() {
    const carousel = this.carousel.nativeElement;
    
    // Mouse events
    carousel.addEventListener('mousedown', (e) => this.startDrag(e));
    carousel.addEventListener('mouseleave', () => this.endDrag());
    carousel.addEventListener('mouseup', () => this.endDrag());
    carousel.addEventListener('mousemove', (e) => this.dragMove(e));
    
    // Touch events
    carousel.addEventListener('touchstart', (e) => this.startDrag(e));
    carousel.addEventListener('touchend', () => this.endDrag());
    carousel.addEventListener('touchmove', (e) => this.dragMove(e));
  }

  isDragging = false;
  startPos = 0;
  currentTranslate = 0;
  prevTranslate = 0;

  startDrag(e: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.startPos = this.getPositionX(e);
    this.carousel.nativeElement.style.cursor = 'grabbing';
  }

  endDrag() {
    this.isDragging = false;
    this.carousel.nativeElement.style.cursor = 'grab';
  }

  dragMove(e: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    
    const currentPosition = this.getPositionX(e);
    this.currentTranslate = this.prevTranslate + currentPosition - this.startPos;
    
    this.carousel.nativeElement.style.transform = `translateX(${this.currentTranslate}px)`;
  }

  getPositionX(e: MouseEvent | TouchEvent): number {
    return e.type.includes('mouse') 
      ? (e as MouseEvent).pageX 
      : (e as TouchEvent).touches[0].clientX;
  }

  scrollCarousel(direction: number) {
    this.currentSlideIndex = Math.max(0, 
      Math.min(this.currentSlideIndex + direction, this.latestStories.length - 1));
    
    const scrollAmount = this.currentSlideIndex * this.slideWidth;
    this.carousel.nativeElement.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }

  getProgress(storyId: number): number {
    const progress = this.userProgress.find(p => p.storyId == storyId);
    return progress ? progress.percent : 0;
  }
  ngOnInit(): void {
    this.getAllStories();
    this.getCategory();
    this.loadLikedStories();
    this.loadUserStoryProgress();
   
  }
  getAllStories() {
  this.http.get<any>('https://hyperblah.com/funtellocal/allstory.php').subscribe(
    (response) => {
      if (response.status === 'success') {
        // Sort stories by date (assuming there's a 'created_at' or similar field)
        const sortedStories = response.data.sort((a: any, b: any) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        // Get the latest 2 stories
        this.latestStories = sortedStories.slice(0, 2).map((story: any) => ({
          ...story,
          views: +story.views || 0
        }));
        
        // Original stories array (all stories)
        this.stories = response.data.map((story: any) => ({
          ...story,
          views: +story.views || 0,
          average_rating: +story.average_rating || 0,
          total_ratings: +story.total_ratings || 0
        }));
        
        this.calculateTopAuthors(response.data);
        this.loadFollowStatus();
        
      } else {
        console.error('Error fetching stories:', response.message);
      }
    },
    (error) => {
      console.error('API call failed:', error);
    }
  );
}
  calculateTopAuthors(stories: any[]) {
  const authorMap: {
    [user_id: string]: {
      author_name: string;
      user_id: string;
      views: number;
      story_count: number;
    };
  } = {};

  for (const story of stories) {
    const userId = story.user_id;
    const views = +story.views || 0;

    if (!authorMap[userId]) {
      authorMap[userId] = {
        user_id: userId,
        author_name: story.author_name || 'Unknown',
        views: views,
        story_count: 1
      };
    } else {
      authorMap[userId].views += views;
      authorMap[userId].story_count += 1;
    }
  }

  const authorArray = Object.values(authorMap);

  this.topAuthors = authorArray
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
}



  goToSeries(storyId: string, title: string) {
    const slug = this.slugify(title);

    this.router.navigate(['/story', `${storyId}-${slug}`]);
  }
  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')     // replace spaces and non-word chars with -
      .replace(/^-+|-+$/g, '');       // remove leading/trailing dashes
  }
  getCategory() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('token')}` // if you use tokens
    });
    this.http.get<any>('https://hyperblah.com/funtellocal/category.php', { headers: headers, withCredentials: true }).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.categoryColumns = res.data.flat();
          console.log('categoryColumnssss', this.categoryColumns)
        }
      },
      error: (err) => {
        console.error('Failed to fetch categories:', err);
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
  formatCount(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  }

  resumeReading(storyId: number, title: string) {
    const slug = title.toLowerCase().replace(/\s+/g, '-');
    this.router.navigate(['/series', `${storyId}-${slug}`]);
  }
  loadUserStoryProgress() {
    const userId = sessionStorage.getItem('userId');
    const key = `story_progress_${userId}`;
    const data = localStorage.getItem(key);

    if (data) {
      const progress = JSON.parse(data);
      const entries = Object.entries(progress);

      this.userProgress = [];

      for (const [storyId, entry] of Object.entries(progress) as [string, {
        lastReadPartId: number;
        readParts: number[];
        totalParts: number;
        lastPartTitle: string;
        timestamp: number;
      }][]) {
        const percent = Math.round((entry.readParts.length / entry.totalParts) * 100);

        this.http.get<any>(`https://hyperblah.com/funtellocal/allstory.php?id=${storyId}`).subscribe({
          next: (res) => {
            if (res.status === 'success' && res.data?.length) {
              const storyData = res.data.find((story: any) => story.id == +storyId);
              this.userProgress.push({
                storyId,
                title: entry.lastPartTitle,
                lastReadPartId: entry.lastReadPartId,
                percent,
                part: entry.readParts.length,
                total: entry.totalParts,
                timestamp: entry.timestamp,
                image: `https://hyperblah.com/funtellocal/${storyData.story_image}`,
              });
              console.log("userProgress", this.userProgress)

              this.userProgress.sort((a, b) => b.timestamp - a.timestamp);
            }
          },
          error: (err) => {
            console.error(`Failed to fetch story info for storyId ${storyId}`, err);
          }
        });
      }
    }
  }
  toggleFollow(authorId: string) {
  const userId = sessionStorage.getItem('userId');
  if (!userId || userId === authorId) return;

  const isFollowing = this.isFollowingMap[authorId];
  const apiUrl = isFollowing
    ? 'https://hyperblah.com/funtellocal/follow/unfollow.php'
    : 'https://hyperblah.com/funtellocal/follow/follow.php';

  const body = {
    follower_id: +userId,
    following_id: +authorId
  };

  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  this.http.post(apiUrl, body, { headers, withCredentials: true }).subscribe({
    next: (res: any) => {
      this.isFollowingMap[authorId] = !isFollowing;
      console.log(`✅ ${isFollowing ? 'Unfollowed' : 'Followed'} author ${authorId}`);
    },
    error: (err) => {
      console.error('❌ Follow/Unfollow failed:', err);
    }
  });
}
loadFollowStatus() {
  const userId = sessionStorage.getItem('userId');
  if (!userId) return;

  for (const author of this.topAuthors) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http.post<any>(
      'https://hyperblah.com/funtellocal/follow/check_follow.php',
      {
        follower_id: +userId,
        following_id: +author.user_id
      },
      { headers, withCredentials: true }
    ).subscribe({
      next: (res) => {
        this.isFollowingMap[author.user_id] = res.isFollowing || false;
      },
      error: (err) => {
        console.error(`❌ Error checking follow for ${author.user_id}:`, err);
      }
    });
  }
}
}
