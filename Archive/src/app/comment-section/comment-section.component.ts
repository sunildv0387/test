import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.css'
})
export class CommentSectionComponent {
@Input() storyId!: number;

  comments: any[] = [];
  commentText = '';
  parentId: number | null = null;
  userId = sessionStorage.getItem('userId'); 
visibleComments: any[] = [];
displayCount: number = 2;
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
  this.http.get<any>(`https://hyperblah.com/funtellocal/get_comments.php?story_id=${this.storyId}`)
    .subscribe((res: any) => {
      if (res.status === 'success') {
        this.comments = this.buildCommentTree(res.data);
        this.visibleComments = this.comments.slice(0, this.displayCount);
      }
    });
}
showMoreComments(): void {
  this.displayCount += 2;
  this.visibleComments = this.comments.slice(0, this.displayCount);
}

  buildCommentTree(flat: any[]): any[] {
    const map: any = {};
    const roots: any[] = [];

    flat.forEach(item => {
      item.replies = [];
      map[item.id] = item;
    });

    flat.forEach(item => {
      if (item.parent_id) {
        if (map[item.parent_id]) {
          map[item.parent_id].replies.push(item);
        }
      } else {
        roots.push(item);
      }
    });

    return roots;
  }

  postComment(): void {
    if (!this.commentText.trim()) return;

    const body = {
      story_id: this.storyId,
      comment: this.commentText,
      parent_id: this.parentId,
      user_id: this.userId
    };

    this.http.post<any>('https://hyperblah.com/funtellocal/add_comment.php', body,{
      withCredentials: true
    })
      .subscribe((res:any) => {
        if (res.status === 'success') {
          this.commentText = '';
          this.parentId = null;
          this.loadComments(); // It will reset visibleComments to first 2
        } else {
          alert(res.message || 'Failed to post comment.');
        }
      });
  }

  setReply(id: number): void {
    this.parentId = id;
    const textarea = document.getElementById('comment-text') as HTMLTextAreaElement;
    if (textarea) textarea.focus();
  }
}