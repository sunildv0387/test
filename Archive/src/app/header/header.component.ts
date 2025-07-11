import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AllapiService } from '../allapi.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isLoggedIn: boolean = false;
  mobileMenuOpen = false;
  activeDropdown: string | null = null;
  isBrowseMenuOpen = false;
  isBrowseWriteMenuOpen = false;
  isDarkMode = true;
  mobileMenuActive = false;
  searchOverlayActive = false;
  categoryColumns: any[][] = [];
  userName: string = '';
  searchText = '';
  allStories: any[] = [];
  filteredSuggestions: any[] = [];

  constructor(private router: Router, private allApis: AllapiService, private http: HttpClient, private renderer: Renderer2) { }
  
  ngOnInit(): void {
    this.getCategory();
    this.checkLoginStatus();
    this.loadAllStories();
    this.setInitialTheme();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('token')}` // if you use tokens
    });
    this.http.get<any>('https://hyperblah.com/funtellocal/allstory.php', {
      headers: headers,
      withCredentials: true
    }).subscribe({
      next: (res) => {
        console.log('API Response:', res); // 👀 Check this
        this.allStories = Array.isArray(res) ? res : res.data || []; // ✅ Safe assignment
      },
      error: (err) => {
        console.error('Failed to fetch stories:', err);
      }
    });


    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.renderer.addClass(document.documentElement, 'dark');
      this.isDarkMode = true;
    }

  }
  groupCategories(list: any[], chunkSize: number): any[][] {
    const result: any[][] = [];
    for (let i = 0; i < list.length; i += chunkSize) {
      result.push(list.slice(i, i + chunkSize));
    }
    return result;
  }
  getCategory() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('token')}` // if you use tokens
    });
    this.http.get<any>('https://hyperblah.com/funtellocal/category.php', { headers: headers, withCredentials: true }).subscribe({
      next: (res) => {
        if (res.status === 'success' && Array.isArray(res.data)) {
          const grouped = this.groupCategories(res.data, 5); // 5 items per column
          this.categoryColumns = grouped;
          console.log('categoryColumns', this.categoryColumns)
        }
      },
      error: (err) => {
        console.error('Failed to fetch categories:', err);
      }
    });
  }
  toggleBrowseMenu() {
    this.isBrowseMenuOpen = !this.isBrowseMenuOpen;

  }
  toggleBrowseWriteMenu() {
    this.isBrowseWriteMenuOpen = !this.isBrowseWriteMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Close dropdown if clicked outside
    const clickedInsideDropdown = target.closest('.browse-dropdown') ||
      target.closest('.write-dropdown') ||
      target.closest('.user-dropdown');
    if (!clickedInsideDropdown) {
      this.activeDropdown = null;
    }
  }

private setInitialTheme(): void {
    // Force dark mode by default
    this.isDarkMode = true;
    this.renderer.addClass(document.documentElement, 'dark');
    localStorage.setItem('theme', 'dark');
}




  toggleDropdown(name: string): void {
    this.activeDropdown = this.activeDropdown === name ? null : name;
  }

  closeDropdowns() {
    this.activeDropdown = null;
  }

  homePage() {
    this.router.navigate(['']);
  }



  checkLoginStatus() {
    const userId = sessionStorage.getItem('userId');
    this.isLoggedIn = userId !== null;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('token')}` // if you use tokens
    });
    if (this.isLoggedIn) {
      this.http.get<any>('https://hyperblah.com/funtellocal/get_user.php', {
        withCredentials: true,
        headers: headers
      }).subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.userName = res.name || res.username || 'User';
          } else {
            this.userName = '';
            this.isLoggedIn = false;
          }
        },
        error: (err) => {
          console.error('User fetch failed', err);
          this.userName = '';
        }
      });
    }
  }

loadAllStories() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${sessionStorage.getItem('token')}` });
    this.http.get<any>('https://hyperblah.com/funtellocal/allstory.php', { headers, withCredentials: true }).subscribe({
      next: (res) => {
        this.allStories = res.data || [];
      },
      error: () => {
        this.allStories = [];
      }
    });
  }
  logout() {
    this.allApis.logout().subscribe({
      next: () => {
        sessionStorage.removeItem('userId');
        this.isLoggedIn = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout Error:', err);
      }
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuActive = !this.mobileMenuActive;
  }
  toggleSearchOverlay(): void {
    this.searchOverlayActive = !this.searchOverlayActive;
  }
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
        this.renderer.addClass(document.documentElement, 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        this.renderer.removeClass(document.documentElement, 'dark');
        localStorage.setItem('theme', 'light');
    }
}

  navigateToMyWorks() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']); // Redirect to login if not logged in
    } else {
      this.router.navigate(['/myworks']);
    }
  }
  createNewStory() {
    this.router.navigate(['new']);
  }



  onSearchInput() {
    const text = this.searchText.toLowerCase().trim();
    console.log('Input:', text);
    this.filteredSuggestions = this.allStories.filter(story =>
      story.story_title.toLowerCase().includes(text)
    ).slice(0, 5);
    console.log('Suggestions:', this.filteredSuggestions);
  }

  selectSuggestion(suggestion: any) {
    this.searchText = suggestion.story_title;
    this.filteredSuggestions = [];
    const slug = this.slugify(suggestion.story_title);
    this.router.navigate(['/story', `${suggestion.id}-${slug}`]);
  }

  onSearchSubmit(event: Event) {
    event.preventDefault();
    const query = this.searchText.trim();
    if (query) {
      this.filteredSuggestions = [];
      this.searchOverlayActive = false;
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
  }
}