import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-search-result',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './search-result.component.html',
  styleUrl: './search-result.component.css'
})
export class SearchResultComponent {
  isLoggedIn: boolean = false;
  stories: any[] = [];
  categoryId: string | null = null;
  filteredSuggestions: any[] = [];
  isLoading = true;
  errorMessage = '';
  searchText: string = '';
  relatedStories: any[] = [];
 userProgress: any[] = [];
   userId: string | null = null;
displayCount: number = 1;

visibleHistoryCount: number = 1; 


  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    const userId = sessionStorage.getItem('userId');
  this.userId = userId;
  this.isLoggedIn = !!userId;

  this.route.paramMap.subscribe(params => {
    this.categoryId = params.get('id');

    const searchText = this.route.snapshot.queryParamMap.get('q'); // get ?q=searchText
    if (searchText) {
      this.fetchSearchResults(searchText);
      this.loadUserStoryProgress();
    } else if (this.categoryId) {
      this.fetchCategoryStories(this.categoryId);
      this.loadUserStoryProgress();
    }
  });
    
  }
loadMoreHistory() {
  if (this.visibleHistoryCount < this.userProgress.length) {
    console.log("this.userProgress.length", this.userProgress.length)
    this.visibleHistoryCount += 1;
  }
}
  fetchSearchResults(query: string) {
    this.searchText = query;
    this.isLoading = true;
    const apiUrl = `https://hyperblah.com/funtellocal/allstory.php?q=${encodeURIComponent(query)}`;
    this.http.get<any>(apiUrl).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.stories = res.data;
          this.relatedStories = this.getRandomRelatedStories(this.stories, 3);
          console.log('relatedStories', this.relatedStories)
         
        } else {
          this.errorMessage = res.message || 'No matching stories found.';
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load search results.';
        this.isLoading = false;
      }
    });
  }
  onSearchSubmit(event: Event) {
    event.preventDefault();
    const query = this.searchText.trim();
    if (query) {
      this.filteredSuggestions = [];
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  fetchCategoryStories(categoryId: string) {
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
      .replace(/[\s\W-]+/g, '-')     // replace spaces and non-word chars with -
      .replace(/^-+|-+$/g, '');       // remove leading/trailing dashes
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
        author_name:string;
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
                name:storyData.author_name,
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

clearHistory(){
  const userId = sessionStorage.getItem('userId');
  const key = `story_progress_${userId}`;
  localStorage.removeItem(key);
}
}
