from django.contrib import admin
from .models import Post, PostMedia, Like, Comment, Share

admin.site.register(Post)
admin.site.register(PostMedia)
admin.site.register(Like)
admin.site.register(Comment)
admin.site.register(Share)