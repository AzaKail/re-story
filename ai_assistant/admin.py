import logging
from typing import Any
from django.contrib import admin, messages
from django.db import transaction
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _

from .models import DocumentChunk, KnowledgeDocument
from .services.chunking import split_text_into_chunks
from .services.embeddings import get_embedding

logger = logging.getLogger(__name__)


def index_knowledge_document(document: KnowledgeDocument) -> int:
    """
    Synchronously chunk and generate embeddings for a KnowledgeDocument.
    Executed in an atomic database transaction.
    """
    raw_text = document.get_raw_text()
    if not raw_text:
        document.status = "error"
        document.error_message = "No text could be extracted from file or content."
        document.save(update_fields=["status", "error_message"])
        return 0

    with transaction.atomic():
        # Clear previous chunks
        document.chunks.all().delete()

        chunks_text = split_text_into_chunks(raw_text, chunk_size=600, overlap=120)
        if not chunks_text:
            document.status = "error"
            document.error_message = "Document yielded zero chunks during splitting."
            document.save(update_fields=["status", "error_message"])
            return 0

        chunks_to_create = []
        for idx, text in enumerate(chunks_text, start=1):
            vector = get_embedding(text)
            chunk_obj = DocumentChunk(
                document=document,
                chunk_index=idx,
                content=text,
                embedding=vector,
            )
            chunks_to_create.append(chunk_obj)

        DocumentChunk.objects.bulk_create(chunks_to_create)

        document.status = "indexed"
        document.error_message = ""
        document.save(update_fields=["status", "error_message"])

        return len(chunks_to_create)


class DocumentChunkInline(admin.TabularInline):
    """Inline view of document chunks within document detail page."""

    model = DocumentChunk
    extra = 0
    fields = ("chunk_index", "content_preview", "embedding_status")
    readonly_fields = ("chunk_index", "content_preview", "embedding_status")
    can_delete = False

    @admin.display(description=_("Preview"))
    def content_preview(self, obj: DocumentChunk) -> str:
        return obj.content[:100] + ("..." if len(obj.content) > 100 else "")

    @admin.display(description=_("Embedding"))
    def embedding_status(self, obj: DocumentChunk) -> str:
        if obj.embedding:
            return f"Vector [{len(obj.embedding)} dims]"
        return "None"


@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    """Admin configuration for KnowledgeDocument management."""

    list_display = (
        "title",
        "language",
        "status",
        "chunks_count",
        "updated_at",
    )
    list_filter = ("status", "language", "created_at")
    search_fields = ("title", "content")
    readonly_fields = ("status", "error_message", "created_at", "updated_at")
    inlines = [DocumentChunkInline]
    actions = ["reindex_selected_documents"]

    @admin.display(description=_("Chunks"))
    def chunks_count(self, obj: KnowledgeDocument) -> int:
        return obj.chunks.count()

    def save_model(self, request: HttpRequest, obj: KnowledgeDocument, form: Any, change: bool) -> None:
        super().save_model(request, obj, form, change)
        try:
            count = index_knowledge_document(obj)
            self.message_user(
                request,
                _("Document '%(title)s' successfully indexed into %(count)d chunks.")
                % {"title": obj.title, "count": count},
                messages.SUCCESS,
            )
        except Exception as exc:
            logger.error("Failed indexing document '%s': %s", obj.title, exc)
            obj.status = "error"
            obj.error_message = str(exc)
            obj.save(update_fields=["status", "error_message"])
            self.message_user(
                request,
                _("Error indexing document '%(title)s': %(error)s")
                % {"title": obj.title, "error": str(exc)},
                messages.ERROR,
            )

    @admin.action(description=_("Reindex selected documents"))
    def reindex_selected_documents(self, request: HttpRequest, queryset: Any) -> None:
        success_count = 0
        error_count = 0

        for document in queryset:
            try:
                index_knowledge_document(document)
                success_count += 1
            except Exception as exc:
                logger.error("Batch reindex failed for '%s': %s", document.title, exc)
                document.status = "error"
                document.error_message = str(exc)
                document.save(update_fields=["status", "error_message"])
                error_count += 1

        if success_count > 0:
            self.message_user(
                request,
                _("Successfully reindexed %(count)d documents.") % {"count": success_count},
                messages.SUCCESS,
            )
        if error_count > 0:
            self.message_user(
                request,
                _("Failed reindexing %(count)d documents.") % {"count": error_count},
                messages.ERROR,
            )


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    """Admin configuration for DocumentChunk inspection."""

    list_display = ("document", "chunk_index", "content_preview", "updated_at")
    list_filter = ("document__language", "document")
    search_fields = ("content", "document__title")
    readonly_fields = ("document", "chunk_index", "content", "embedding", "updated_at")

    @admin.display(description=_("Updated At"))
    def updated_at(self, obj: DocumentChunk) -> Any:
        return obj.document.updated_at

    @admin.display(description=_("Content Preview"))
    def content_preview(self, obj: DocumentChunk) -> str:
        return obj.content[:120] + ("..." if len(obj.content) > 120 else "")
