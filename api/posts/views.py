from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import CursorPagination

from .services.post_service import PostService
from .selectors.post_selector import PostSelector

from .serializer import (
    PostSerializer,
    PostCreateSerializer,
    PostUpdateSerializer,
    CommentSerializer,
    CommentCreateSerializer,
    ShareSerializer,
)


class FeedPagination(CursorPagination):
    page_size = 5
    ordering = "-created_at"


class SharePagination(CursorPagination):
    page_size = 5
    ordering = "-shared_at"


class PostListCreateView(generics.ListCreateAPIView):

    permission_classes = [IsAuthenticated]

    pagination_class = FeedPagination

    def get_queryset(self):

        return PostSelector.get_feed(user=self.request.user)

    def get_serializer_class(self):

        if self.request.method == "POST":
            return PostCreateSerializer

        return PostSerializer

    def get_serializer_context(self):

        return {
            "request": self.request,
        }

    def create(self, request, *args, **kwargs):

        serializer = PostCreateSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        post = PostService.create_post(
            author=request.user,
            **serializer.validated_data,
        )

        response_serializer = PostSerializer(
            post,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class UserPostsView(generics.ListAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = PostSerializer

    pagination_class = FeedPagination

    def get_queryset(self):

        return PostSelector.get_user_posts(
            target_user=self.kwargs["user_id"],
            request_user=self.request.user,
        )

    def get_serializer_context(self):

        return {
            "request": self.request,
        }


class PostDetailView(generics.RetrieveAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = PostSerializer

    lookup_field = "id"

    def get_object(self):

        return PostSelector.get_post_by_id(
            post_id=self.kwargs["pk"],
            user=self.request.user,
        )

    def get_serializer_context(self):

        return {
            "request": self.request,
        }


class PostUpdateView(generics.UpdateAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = PostUpdateSerializer

    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):

        serializer = PostUpdateSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        post = PostService.update_post(
            post_id=self.kwargs["pk"],
            user=request.user,
            caption=serializer.validated_data["caption"],
        )

        response_serializer = PostSerializer(
            post,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class PostDeleteView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

        PostService.delete_post(
            post_id=pk,
            user=request.user,
        )

        return Response(
            {"detail": "Post deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


class PostLikeView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        result = PostService.toggle_like(
            post_id=pk,
            user=request.user,
        )

        return Response(
            result,
            status=status.HTTP_200_OK,
        )


class PostShareView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        note = request.data.get("note", "")

        result = PostService.toggle_share(
            user=request.user,
            post_id=pk,
            note=note,
        )

        return Response(
            result,
            status=status.HTTP_200_OK,
        )


class ShareRetrieveView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    serializer_class = ShareSerializer

    pagination_class = SharePagination

    def get_queryset(self):
        return PostSelector.get_shares(self.kwargs["pk"])


class CommentListCreateView(generics.ListCreateAPIView):

    permission_classes = [IsAuthenticated]

    pagination_class = FeedPagination

    def get_queryset(self):

        return PostSelector.get_comments(post_id=self.kwargs["pk"])

    def get_serializer_class(self):

        if self.request.method == "POST":
            return CommentCreateSerializer

        return CommentSerializer

    def get_serializer_context(self):

        return {
            "request": self.request,
        }

    def create(self, request, *args, **kwargs):

        serializer = CommentCreateSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        comment = PostService.add_comment(
            post_id=self.kwargs["pk"],
            author=request.user,
            **serializer.validated_data,
        )

        response_serializer = CommentSerializer(
            comment,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class CommentUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        body = request.data.get("body")

        if not body:
            return Response(
                {"detail": "Body is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = PostService.update_comment(
            comment_id=pk,
            body=body,
            user=request.user,
        )

        serializer = CommentSerializer(
            comment,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class CommentDeleteView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

        PostService.delete_comment(
            comment_id=pk,
            user=request.user,
        )

        return Response(
            {"detail": "Comment deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


class ReplyUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        body = request.data.get("body")

        if not body:
            return Response(
                {"detail": "Body is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reply = PostService.update_reply(
            reply_id=pk,
            user=request.user,
            body=body,
        )

        serializer = CommentSerializer(
            reply,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class ReplyDeleteView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

        PostService.delete_reply(
            reply_id=pk,
            user=request.user,
        )

        return Response(
            {"detail": "Reply deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )
