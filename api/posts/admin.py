from django.contrib import admin
from .models import Post, PostMedia, Like, Comment, Share

admin.site.register(Post, PostMedia, Like, Comment, Share)