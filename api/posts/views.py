from rest_framework import generics
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
)
from .serializer import (
    PostMediaSerializer,
    PostSerializer,
    PostCreateSerializer,
    PostUpdateSerializer,
    CommentSerializer,
    CommentCreateSerializer,
)
from .models import Post, Comment
from rest_framework.permissions import IsAuthenticated
from .services.post_service import PostService
from .selectors.post_selector import PostSelector
from rest_framework.response import Response
from rest_framework.views import APIView


class PostListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PostSelector.get_feed(self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PostCreateSerializer
        return PostSerializer

    def create(self, request, *args, **kwargs):
        s = PostCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        post = PostService.create_post(**s.validated_data, author=request.user)
        return Response(
            PostSerializer(post, context={"request": request}).data,
            status=HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class PostDetailView(generics.RetrieveAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return PostSelector.get_post_by_id(post_id=self.kwargs["pk"])

    def get_serializer_context(self):
        return {"request": self.request}


class PostUpdateView(generics.UpdateAPIView):
    serializer_class = PostUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return PostSelector.get_post_by_id(post_id=self.kwargs["pk"])

    def patch(self, request, *args, **kwargs):
        s = PostUpdateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            post = PostService.update_post(
                post_id=self.kwargs["pk"],
                user=request.user,
                caption=s.validated_data["caption"],
            )
        except PermissionError as e:
            return Response({"detail": str(e)}, status=HTTP_403_FORBIDDEN)

        return Response(
            PostSerializer(post, context={"request": request}).data, status=HTTP_200_OK
        )


class PostDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            PostService.delete_post(post_id=pk, user=request.user)
        except PermissionError as e:
            return Response({"detail": str(e)}, status=HTTP_403_FORBIDDEN)

        return Response({"detail": "Post deleted."}, status=HTTP_204_NO_CONTENT)


class PostLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        result = PostService.toggle_like(post_id=pk, user=request.user)
        return Response(result, status=HTTP_200_OK)


class PostShareView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        note = request.data.get("note")
        result = PostService.toogle_share(user=request.user, post_id=pk, note=note)

        return Response(result, status=HTTP_200_OK)


class CommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PostSelector.get_comments(self.kwargs["pk"])

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CommentCreateSerializer
        return CommentSerializer

    def get_serializer_context(self):
        return {"request": self.request}

    def create(self, request, *args, **kwargs):
        s = CommentCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        comment = PostService.add_comment(
            post_id=self.kwargs["id"], author=request.user, **s.validated_data
        )

        return Response(
            CommentSerializer(comment, context={"request": request}).data,
            status=HTTP_201_CREATED,
        )


class CommentUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        body = request.data.get("body")
        if not body:
            return Response(
                {"detail": "Body is required."}, status=HTTP_400_BAD_REQUEST
            )
        try:
            comment = PostService.update_comment(
                comment_id=pk, body=body, user=request.user
            )
        except PermissionError as e:
            return Response({"detail": str(e)}, status=HTTP_403_FORBIDDEN)

        return Response(
            CommentSerializer(comment, context={"request": request}).data,
            status=HTTP_200_OK,
        )


class CommentDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            PostService.delete_comment(comment_id=pk, user=request.user)
        except PermissionError as e:
            return Response({"detail": str(e)}, status=HTTP_403_FORBIDDEN)

        return Response({"detail", "Comment deleted."}, status=HTTP_204_NO_CONTENT)


class ReplyUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        body = request.data.get("body")
        if not body:
            return Response(
                {"detail": "Body is required."}, status=HTTP_400_BAD_REQUEST
            )
        try:
            reply = PostService.update_reply(reply_id=pk, user=request.user, body=body)
        except ValueError as e:
            return Response({"detail": str(e)}, status=HTTP_400_BAD_REQUEST)
        except PermissionError as e:
            return Response({"detail": str(e)}, status=HTTP_403_FORBIDDEN)
        return Response(
            CommentSerializer(reply, context={"request": request}).data,
            status=HTTP_200_OK,
        )


class ReplyDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            PostService.delete_reply(reply_id=pk, user=request.user)

        except ValueError as e:
            return Response({"detail": str(e)}, status=HTTP_400_BAD_REQUEST)

        except PermissionError as e:
            return Response({"detail": str(e)}, status=HTTP_403_FORBIDDEN)

        return Response({"detail", "Comment deleted."}, status=HTTP_204_NO_CONTENT)
