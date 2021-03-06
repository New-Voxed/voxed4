import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { createUrl } from '../helpers/functions';
import { AuthService } from './auth.service';
import { SocketService } from './socket.service';
@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly postsPerRefresh = 20;
  private lastPostDate: FirebaseFirestore.Timestamp;

  constructor(private db: AngularFirestore, private http: HttpClient, private auth: AuthService, private socket: SocketService) { }

  setNewPostSocket(handler) {
    this.socket.io.on('newPostCreated', handler);
  }

  removeNewPostSocket() {
    this.socket.io.off('newPostCreated');
  }

  setDeletedPostSocket(handler) {
    this.socket.io.on('deletedPost', handler);
  }

  setMovedPostSocket(handler) {
    this.socket.io.on('movedPost', handler);
  }

  getPostById(postId: string) {
    return this.db.collection('posts').doc(postId).get();
  }

  async getPostList() {
    let query = this.db.collection('posts').ref.orderBy('createdAt', 'desc').limit(this.postsPerRefresh);

    if (this.lastPostDate != undefined)
      query = query.startAfter(this.lastPostDate);

    const posts = await query.get();

    if (!posts.empty)
      this.lastPostDate = (posts.docs[posts.size - 1].data() as any).createdAt;

    return posts;
  }

  async getPostListByCategory(category: string) {
    let query = this.db.collection('posts').ref
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .limit(this.postsPerRefresh);

    if (this.lastPostDate != undefined)
      query = query.startAfter(this.lastPostDate);

    const posts = await query.get();

    if (!posts.empty)
      this.lastPostDate = (posts.docs[posts.size - 1].data() as any).createdAt;

    return posts;
  }

  getComments(postId: string) {
    return this.db.collection('comments').ref.where('postId', '==', postId).orderBy('createdAt', 'desc').get();
  }

  async deletePost(postID: string) {
    const token = await this.auth.getToken();
    this.http.post(createUrl('delete'), { postID, token }, { responseType: 'text' }).subscribe((data) => console.log(data));
  }

  async movePost(postID: string, category: string) {
    const token = await this.auth.getToken();
    this.http.post(createUrl('move'), { postID, token, category }, { responseType: 'text' }).subscribe((data) => console.log(data));
  }

  async changePostCategory(postId: string, category: string) {
    return this.db.collection('posts').doc(postId).set({ category: category }, { merge: true })
  }

  clearLastPostDate(){
    this.lastPostDate = undefined;
  }
}
