import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [HeaderComponent, CommonModule],
  templateUrl: './library.component.html',
  styleUrl: './library.component.css'
})
export class LibraryComponent {
  stories: any[] = [];
  categoryId: string | null = null;
  filteredSuggestions: any[] = [];
  isLoading = true;
  errorMessage = '';
  searchText: string = '';
  relatedStories: any[] = [];
  userProgress: any[] = [];
  userId: string | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.userId = sessionStorage.getItem('userId'); // Get user ID from session storage
    
    this.route.paramMap.subscribe(params => {
      this.categoryId = params.get('id');

      const searchText = this.route.snapshot.queryParamMap.get('q');
      if (searchText) {
        this.loadUserStoryProgress();
      } else if (this.categoryId) {
        this.fetchLibraryStories(this.categoryId);
        this.loadUserStoryProgress();
      } else {
        // If no category ID, fetch user's library
        this.fetchUserLibrary();
      }
    });
  }

  // New function to fetch user's library
  fetchUserLibrary() {
    if (!this.userId) {
      this.errorMessage = 'User not logged in';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.http.get<any>(`https://hyperblah.com/funtellocal/allstory.php?action=library&user_id=${this.userId}`)
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.stories = res.data;
            this.relatedStories = this.getRandomRelatedStories(this.stories, 3);
          } else {
            this.errorMessage = res.message || 'No stories in your library.';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Failed to load your library.';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  // Rest of your existing methods remain the same...
  onSearchSubmit(event: Event) {
    event.preventDefault();
    const query = this.searchText.trim();
    if (query) {
      this.filteredSuggestions = [];
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  fetchLibraryStories(categoryId: string) {
    this.isLoading = true;
    this.http.get<any>(`https://hyperblah.com/funtellocal/allstory.php?category_id=${categoryId}`)
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.stories = res.data;
            this.relatedStories = this.getRandomRelatedStories(this.stories, 3);
          } else {
            this.errorMessage = res.message || 'No stories found.';
          }
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load category stories.';
          this.isLoading = false;
        }
      });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '' : date.toDateString();
  }

  goToSeries(storyId: string, title: string) {
    const slug = this.slugify(title);
    this.router.navigate(['/story', `${storyId}-${slug}`]);
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  getRandomRelatedStories(allStories: any[], count: number): any[] {
    const shuffled = [...allStories].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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
        author_name: string;
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
                name: storyData.author_name,
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

  clearHistory() {
    const userId = sessionStorage.getItem('userId');
    const key = `story_progress_${userId}`;
    localStorage.removeItem(key);
  }
}