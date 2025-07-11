import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { AllapiService } from '../allapi.service';
import { HeaderComponent } from '../header/header.component';
import { EditorModule } from '@tinymce/tinymce-angular';

import { HttpClient } from '@angular/common/http';
declare var tinymce: any;
@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EditorModule, HeaderComponent, RouterModule], 
  templateUrl: './new.component.html',
  styleUrl: './new.component.css'
})
export class NewComponent {
storyForm: FormGroup;
  editorConfig: any;
  storyId: number | null = null;
  isReadOnly: boolean = false; // **Status 1 ke liye read-only mode**
tagsList: string[] = [];
selectedFile: File | null = null;
imagePreview: string | ArrayBuffer | null = null;
  constructor(
 
    private fb: FormBuilder, 
    private router: Router,
    private route: ActivatedRoute,  
    private http: HttpClient
  ) {
    
this.storyForm = this.fb.group({
      story_title: ['', Validators.required],
      story_description: [''],
      tagsInput: [''],
      tags: [''],
      copyright: [''],
      audiences:[''],
      language:[''],
      category:['']
    });
  }

  ngOnInit(): void {
   const userId = sessionStorage.getItem('userId');
  if (!userId || userId === 'null') {
    this.router.navigate(['login']);
    return;
  }
  }
  onTagsKeyUp(event: any) {
    if (event.key === ',' || event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  onFileSelected(event: any) {
  const file = event.target.files[0];
  this.handleFile(file);
}

onFileDropped(event: DragEvent) {
  event.preventDefault();
  const file = event.dataTransfer?.files[0];
  if (file) {
  this.handleFile(file);
}
}

handleFile(file: File) {
  if (file && file.size <= 1024 * 1024) { // 1MB limit
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(file);
  } else {
    alert('File size must be 1MB or less.');
  }
}

onDragOver(event: DragEvent) {
  event.preventDefault();
}
addTag() {
    const tagsInput = this.storyForm.get('tagsInput')?.value.trim();
    if (tagsInput) {
      // Split by comma and trim each tag
      const newTags = tagsInput.split(',')
        .map((tag:any) => tag.trim())
        .filter((tag:any) => tag.length > 0);
      
      // Add to tags list (avoid duplicates)
      newTags.forEach((tag:any) => {
        if (!this.tagsList.includes(tag)) {
          this.tagsList.push(tag);
        }
      });
      
      // Update the form control with comma-separated tags
      this.storyForm.get('tags')?.setValue(this.tagsList.join(','));
      this.storyForm.get('tagsInput')?.setValue('');
    }
  }
   removeTag(index: number) {
    this.tagsList.splice(index, 1);
    this.storyForm.get('tags')?.setValue(this.tagsList.join(','));
  }
  onSubmit() {
  if (this.storyForm.valid) {
    const formData = new FormData();

    formData.append('story_title', this.storyForm.get('story_title')?.value);
    formData.append('story_description', this.storyForm.get('story_description')?.value);
    formData.append('tags', this.storyForm.get('tags')?.value);
    formData.append('copyright', this.storyForm.get('copyright')?.value);
    formData.append('audiences', this.storyForm.get('audiences')?.value);
    formData.append('language', this.storyForm.get('language')?.value);
    formData.append('category', this.storyForm.get('category')?.value);

    if (this.selectedFile) {
      formData.append('cover_image', this.selectedFile);
    }

    const userId = sessionStorage.getItem('userId') ?? '0';
    formData.append('user_id', userId);

    this.http.post<{ status: string, message?: string, story_id?: number }>(
      'https://hyperblah.com/funtellocal/save_story.php',
      formData,
      { withCredentials: false }
    ).subscribe({
      next: (res) => {
        console.log(res);
        if (res.status === 'success' && res.story_id) {
          this.router.navigate(['/creat', res.story_id]);  // ✅ success path
        } else {
          alert(res.message || 'Something went wrong.');
        }
      },
      error: (err) => {
        console.error(err);
        alert('Something went wrong while saving the story.');
      }
    });
  }
}


  writenew() {
    this.onSubmit();
  }
}