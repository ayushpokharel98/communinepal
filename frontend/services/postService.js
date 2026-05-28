// src/services/postService.js

import api from "./api";


const postService = {

  // ==========================================
  // POSTS
  // ==========================================

  async getFeed(cursor = null) {

    const params = cursor ? `?cursor=${cursor}` : "";

    const response = await api.get(`/posts/${params}`);

    return response.data;
  },

  async getUserPosts(userId, cursor = null) {

    const params = cursor ? `?cursor=${cursor}` : "";

    const response = await api.get(
      `/posts/user/${userId}/${params}`
    );

    return response.data;
  },

  async getPost(postId) {

    const response = await api.get(
      `/posts/${postId}/`
    );

    return response.data;
  },

  async createPost({
    caption = "",
    files = [],
    mediaTypes = [],
  }) {

    const formData = new FormData();

    formData.append("caption", caption);

    files.forEach((file) => {
      formData.append("uploaded_files", file);
    });

    mediaTypes.forEach((type) => {
      formData.append("media_types", type);
    });

    const response = await api.post(
      "/posts/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  async updatePost(postId, caption) {

    const response = await api.patch(
      `/posts/${postId}/update/`,
      {
        caption,
      }
    );

    return response.data;
  },

  async deletePost(postId) {

    const response = await api.delete(
      `/posts/${postId}/delete/`
    );

    return response.data;
  },

  // ==========================================
  // LIKES
  // ==========================================

  async toggleLike(postId) {

    const response = await api.post(
      `/posts/${postId}/like/`
    );

    return response.data;
  },

  // ==========================================
  // SHARES
  // ==========================================

  async toggleShare(postId, note = "") {

    const response = await api.post(
      `/posts/${postId}/share/`,
      {
        note,
      }
    );

    return response.data;
  },

  async getShares(userId, cursor=null) {
    const params = cursor ? `?cursor=${cursor}` : "";

    const response = await api.get(
      `/posts/user/${userId}/shares/${params}`
    );

    return response.data
  },

  // ==========================================
  // COMMENTS
  // ==========================================

  async getComments(postId, cursor = null) {

    const params = {};

    if (cursor) {
      params.cursor = cursor;
    }

    const response = await api.get(
      `/posts/${postId}/comments/`,
      {
        params,
      }
    );

    return response.data;
  },

  async createComment({
    postId,
    body,
    parentId = null,
  }) {

    const response = await api.post(
      `/posts/${postId}/comments/`,
      {
        body,
        parent_id: parentId,
      }
    );

    return response.data;
  },

  async updateComment(commentId, body) {

    const response = await api.patch(
      `/posts/comments/${commentId}/update/`,
      {
        body,
      }
    );

    return response.data;
  },

  async deleteComment(commentId) {

    const response = await api.delete(
      `/posts/comments/${commentId}/delete/`
    );

    return response.data;
  },

  // ==========================================
  // REPLIES
  // ==========================================

  async updateReply(replyId, body) {

    const response = await api.patch(
      `/posts/replies/${replyId}/update/`,
      {
        body,
      }
    );

    return response.data;
  },

  async deleteReply(replyId) {

    const response = await api.delete(
      `/posts/replies/${replyId}/delete/`
    );

    return response.data;
  },
};


export default postService;