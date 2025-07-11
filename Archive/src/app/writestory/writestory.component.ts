import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { AllapiService } from '../allapi.service';
import { HeaderComponent } from '../header/header.component';
import { EditorModule } from '@tinymce/tinymce-angular';


declare var tinymce: any;

@Component({
  selector: 'app-writestory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EditorModule, HeaderComponent, RouterModule], 
  templateUrl: './writestory.component.html',
  styleUrl: './writestory.component.css'
})
export class WritestoryComponent implements OnInit {
  storyForm: FormGroup;
  editorConfig: any;
  storyId: number | null = null;
  isReadOnly: boolean = false; // **Status 1 ke liye read-only mode**

  constructor(
    private contentService: AllapiService, 
    private fb: FormBuilder, 
    private router: Router,
    private route: ActivatedRoute,  
    private cd: ChangeDetectorRef
  ) {
    this.storyForm = this.fb.group({
      story_title: ['', Validators.required],
      story_content: ['', Validators.required]
    });

    this.setEditorConfig(false);
  }

  ngOnInit(): void {
  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    this.router.navigate(['login']);
    return;
  }

  this.route.paramMap.subscribe(params => {
    const idAndTitle = params.get('idAndTitle');
    if (idAndTitle) {
      const storyId = idAndTitle.split('-')[0];  // only ID part
      this.storyId = parseInt(storyId, 10);      // ✅ set it here
      console.log('Story ID:', this.storyId);

      this.loadStory(); // ✅ call loadStory here directly
    }
  });
}

  loadStory() {
    if (!this.storyId) return;
  
    this.contentService.getStoryById(this.storyId).subscribe({
      next: (response:any) => {
        if (response.status === 'success' && response.data) {
          let storyHtml = response.data.content || '';
          let storyTitle = response.data.story_title || '';
  
          storyHtml = this.cleanWordHTML(storyHtml);
  
          // ✅ Set content and title in form
          this.storyForm.patchValue({
            story_title: storyTitle,
            story_content: storyHtml
          });
  
          // ✅ Set TinyMCE content
          setTimeout(() => {
  if (tinymce.activeEditor) {
    tinymce.activeEditor.setContent(storyHtml);
  }
}, 100);
  
          // ✅ Enable read-only mode if status = 1
          this.isReadOnly = response.data.status === 1;
          this.setEditorConfig(this.isReadOnly);
  
          // ✅ Trigger change detection
          this.cd.detectChanges();
          console.log('Story title loaded:', storyTitle);
        }
      },
      error: (err) => console.error('Error loading story:', err)
    });
  }
  
  cleanWordHTML(html: string): string {
    if (!html) return '';
    return html
    .replace(/<!--[\s\S]*?-->/g, '') // Remove all HTML comments
    .replace(/<(\w+)[^>]*>\s*<\/\1>/g, '') // Remove empty tags
    .replace(/<(\w+)[^>]*class="[^"]*"[^>]*>/g, '<$1>') // Remove all class attributes
    .replace(/<(\w+)[^>]*style="[^"]*"[^>]*>/g, '<$1>') // Remove all style attributes
    .replace(/<span[^>]*>/g, '') // Remove span opening tags
    .replace(/<\/span>/g, '') // Remove span closing tags
    .replace(/<font[^>]*>/g, '') // Remove font opening tags
    .replace(/<\/font>/g, '') // Remove font closing tags
    .replace(/<o:p>|<\/o:p>/g, '') // Remove Office specific tags
    .replace(/<(\w+)[^>]*>(&nbsp;|\s)*<\/\1>/g, '') // Remove tags containing only &nbsp; or whitespace
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with normal space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}
  setEditorConfig(isReadOnly: boolean) {
  this.editorConfig = {
    height: 500,
    menubar: false,
    plugins: ['lists', 'link', 'image', 'code', 'paste'],
    toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | removeformat | code',
    readonly: isReadOnly,
    directionality: 'ltr',
    
    // Paste handling
    paste_as_text: false, // Set to true if you want plain text only
    paste_block_drop: true,
    paste_data_images: false,
    paste_webkit_styles: 'none',
    paste_remove_styles: true,
    paste_remove_styles_if_webkit: true,
    paste_strip_class_attributes: 'all',

    // Content filtering (only one valid_elements definition)
    valid_elements: 'p,h1,h2,h3,h4,h5,h6,strong,em,b,i,u,a[href|target=_blank],ul,ol,li,img[src|alt|width|height],br,hr,blockquote,pre,code',
    
    // Extended elements (if needed, merge with valid_elements)
    // extended_valid_elements: '', // Comment out or merge with valid_elements
    
    // Forbidden elements
    invalid_elements: 'script,iframe,object,embed,style,link,form,input,textarea,button,table,tr,td',
    
    // Content CSS
    content_css: false,
    
    // Automatic cleanup
    cleanup: true,
    verify_html: true
  };
}
  

  updateContent() {
    setTimeout(() => {
      if (tinymce.activeEditor) {
        const content = tinymce.activeEditor.getContent() || '';
        this.storyForm.controls['story_content'].setValue(content);
        this.storyForm.updateValueAndValidity();
        this.cd.detectChanges();
      }
    }, 0);
  }
  publishStory() {
  this.updateContent(); // Sync TinyMCE content with form

  setTimeout(() => {
    const formValues = this.storyForm.getRawValue();
    const storyTitle = (formValues.story_title || '').trim();
    const storyContent = (formValues.story_content || '').trim();

    if (!this.storyId) {
      alert('⚠ Cannot publish. Story ID is missing.');
      return;
    }

    if (!storyTitle || !storyContent || storyTitle.length > 255 || this.stripHtml(storyContent).trim().length < 10) {
      alert('⚠ Please complete the title and content before publishing.');
      return;
    }

    const formData = new FormData();
    formData.append('story_id', String(this.storyId));
    formData.append('story_title', storyTitle);
    formData.append('story_content', storyContent);

    this.contentService.publishStory(formData).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          alert('✅ Story published successfully!');
          this.router.navigate(['/myworks']);
        } else {
          alert('⚠ Failed to publish: ' + (response.message || 'Unknown error'));
        }
      },
      error: (err) => {
        console.error('Publish error:', err);
        alert('⚠ Server error occurred during publish.');
      }
    });
  }, 10);
}
onSubmit() {
  this.updateContent(); 

  setTimeout(() => {
    const formValues = this.storyForm.getRawValue();
    const storyTitle = (formValues.story_title || '').trim();
    const storyContent = (formValues.story_content || '').trim();

    // 1. Client-side validations
    if (!storyTitle) {
      alert('⚠ Please enter a story title');
      this.storyForm.controls['story_title'].markAsTouched();
      return;
    }

    if (storyTitle.length > 255) {
      alert('⚠ Title is too long (max 255 characters)');
      return;
    }

    if (!storyContent) {
      alert('⚠ Please enter story content');
      this.storyForm.controls['story_content'].markAsTouched();
      return;
    }

    const textOnlyContent = this.stripHtml(storyContent).trim();
    if (textOnlyContent.length < 10) {
      alert('⚠ Story content must contain at least 10 characters (excluding HTML)');
      return;
    }

    // 2. FormData creation

const formData = new FormData();
formData.append('story_id', String(this.storyId));
formData.append('story_title', storyTitle);
formData.append('story_content', storyContent); // or cleaned content


if (this.storyId) {
  formData.append('story_id', String(this.storyId));
}

const userId = sessionStorage.getItem('userId');
if (userId) {
  formData.append('user_id', userId);
}

// ✅ Only after all values are appended, then log:
console.log('Sending FormData:', {
  story_id: formData.get('story_id'),
  story_title: formData.get('story_title'),
  story_content: formData.get('story_content')
});

   
    // 3. API call
    const apiCall = this.storyId 
      ? this.contentService.updateStory(formData)
      : this.contentService.addStory(formData);

    apiCall.subscribe({
      next: (response) => {
        console.log('Server response:', response);
        if (response.status === 'success') {
          alert('✓ Story saved successfully!');
          // this.router.navigate(['myqork']);
        } else {
          alert(`⚠ Server error: ${response.message || 'Unknown error'}`);
        }
      },
      error: (err) => {
        console.error('API error:', err);
        alert('⚠ Failed to save story. Please check console for details.');
      }
    });
  }, 10); // Wait for content update to reflect
}


// Helper function to strip HTML tags for length validation
private stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
goBack(){
  window.history.back();
}
}
