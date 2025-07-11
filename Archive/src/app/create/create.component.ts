import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EditorModule } from '@tinymce/tinymce-angular';
import { HeaderComponent } from '../header/header.component';
declare var tinymce: any;
@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, EditorModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
 storyForm!: FormGroup;
  storyId: number = 0;
  selectedAudioFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient
  ) {}
@ViewChild('audioInput') audioInput!: ElementRef<HTMLInputElement>;
 ngOnInit(): void {
  const paramId = this.route.snapshot.paramMap.get('storyId');
  this.storyId = paramId ? Number(paramId) : 0;
  console.log('✅ Story ID received from route:', this.storyId);

  this.storyForm = this.fb.group({
    story_title: ['', Validators.required],
    story_content: ['', Validators.required],
    video_link: [''],
    audio: ['']
  });
}

onAudioFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedAudioFile = file;
  }
}
triggerFileInput() {
  this.audioInput.nativeElement.click();
}



onDragOver(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
}

onDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();

  const file = event.dataTransfer?.files[0];
  if (file && (file.type === 'audio/mp3' || file.type === 'audio/wav' || file.name.endsWith('.mp3') || file.name.endsWith('.wav'))) {
    this.selectedAudioFile = file;
    console.log("🎵 File dropped:", file);
  } else {
    alert("Only MP3 or WAV files are allowed.");
  }
}
  onSubmit() {
  const user_id = sessionStorage.getItem('userId');
  if (!user_id) {
    alert('Please log in again');
    return;
  }

  if (this.storyForm.invalid) {
    alert('Please complete all required fields');
    return;
  }

  const formValues = this.storyForm.value;
  const formData = new FormData();

  formData.append('user_id', user_id);
  formData.append('story_title', formValues.story_title);
  formData.append('story_content', formValues.story_content);
  formData.append('story_id', this.storyId.toString());
  formData.append('video_link', formValues.video_link || '');

  // Add audio file if selected, else add audio URL
  if (this.selectedAudioFile) {
    formData.append('audio_file', this.selectedAudioFile);
  } else {
    formData.append('audio_url', formValues.audio || '');
  }

  this.http.post('https://hyperblah.com/funtellocal/addstory.php', formData).subscribe({
    next: (res: any) => {
      console.log('✅ Server response:', res);
      if (res.status === 'success') {
        alert('✓ New part added!');
        this.router.navigate(['/episode', `${this.storyId}-` + this.slugify(formValues.story_title)]);
      } else {
        alert('⚠ Error: ' + res.message);
      }
    },
    error: (err) => {
      console.error('⚠ API error', err);
      alert('Something went wrong.');
    }
  });
}


  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
