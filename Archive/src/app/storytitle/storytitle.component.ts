import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AllapiService } from '../allapi.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-storytitle',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, RouterModule],
  templateUrl: './storytitle.component.html',
  styleUrl: './storytitle.component.css'
})
export class StorytitleComponent implements OnInit {
  storyForm: FormGroup;
  storyId: number | null = null;
  isReadOnly: boolean = false;

  constructor(
    private contentService: AllapiService, 
    private fb: FormBuilder, 
    private router: Router,
    private route: ActivatedRoute,  
    private cd: ChangeDetectorRef
  ) {
    this.storyForm = this.fb.group({
      story_title: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['login']);
      return;
    }

    // Check if editing existing story
    this.route.queryParams.subscribe(params => {
      if (params['storyId']) {
        this.storyId = parseInt(params['storyId'], 10);
        this.loadStory();
      }
    });
  }

  loadStory() {
    if (!this.storyId) return;
  
    this.contentService.getStoryById(this.storyId).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.storyForm.patchValue({
            story_title: response.data.title || ''
          });

          // Enable read-only mode if status = 1
          this.isReadOnly = response.data.status === 1;
        }
      },
      error: (err) => console.error('Error loading story:', err)
    });
  }

  onSubmit() {
    const userId = sessionStorage.getItem('userId');
    const storyTitle = this.storyForm.get('story_title')?.value.trim();

    if (!storyTitle) {
      alert('⚠ Story title cannot be empty');
      return;
    }

    if (this.storyId) {
      // Update existing story
      const formData = new FormData();
formData.append('story_id', String(this.storyId));
formData.append('story_title', storyTitle);


      this.contentService.updateStory(formData).subscribe({
        next: () => {
          alert('Story updated successfully!');
          this.router.navigate(['/create']);
        },
        error: (err) => console.error('❌ Error updating:', err)
      });
    } else {
      // Create new story
      const formData = new FormData();
      formData.append('user_id', userId || '');
      formData.append('story_title', storyTitle);

      this.contentService.createStory(formData).subscribe({
        next: () => {
          alert('Story added successfully!');
          this.router.navigate(['/creat']);
        },
        error: (err) => console.error('❌ Error adding:', err)
      });
    }
  }
}
