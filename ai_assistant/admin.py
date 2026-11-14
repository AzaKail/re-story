import logging
from pathlib import Path
from typing import Any
from django.contrib import admin, messages
from django.core.files.base import ContentFile
from django.db import transaction
from django.http import HttpRequest
from django.shortcuts import redirect, render
from django.urls import path
from django.utils.translation import gettext_lazy as _

from .forms import BatchUploadForm
from .models import DocumentChunk, KnowledgeDocument
from .services.chunking import split_text_into_chunks
from .services.embeddings import get_embedding

logger = logging.getLogger(__name__)


def extract_title_from_text(filename: str, text: str) -> str:
    """Extract first markdown heading or fallback to cleaned filename."""
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped.lstrip("# ").strip()
            if title and len(title) <= 200:
                return title
            break
        elif stripped and not stripped.startswith("#"):
            break
    stem = Path(filename).stem
    return stem.replace("_", " ").strip() or filename


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
    change_list_template = "admin/ai_assistant/knowledgedocument/change_list.html"

    def get_urls(self) -> list[Any]:
        urls = super().get_urls()
        custom_urls = [
            path(
                "batch-upload/",
                self.admin_site.admin_view(self.batch_upload_view),
                name="ai_assistant_batch_upload",
            ),
        ]
        return custom_urls + urls

    def batch_upload_view(self, request: HttpRequest) -> Any:
        if not self.has_add_permission(request):
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied

        if request.method == "POST":
            form = BatchUploadForm(request.POST, request.FILES)
            if form.is_valid():
                language = form.cleaned_data["language"]
                auto_index = form.cleaned_data["auto_index"]
                overwrite = form.cleaned_data["overwrite"]

                collected_files: list[tuple[str, str]] = []
                file_read_errors: list[str] = []

                # 1. From Server Folder Path
                resolved_folder = form.cleaned_data.get("resolved_folder_path")
                if resolved_folder:
                    for f_path in resolved_folder.rglob("*"):
                        if f_path.is_file() and f_path.suffix.lower() in (".txt", ".md"):
                            try:
                                text = f_path.read_text(encoding="utf-8")
                                collected_files.append((f_path.name, text))
                            except Exception as exc:
                                file_read_errors.append(f"{f_path.name}: {exc}")

                # 2. From Uploaded Files & Folder Upload
                upload_sources = request.FILES.getlist("files") + request.FILES.getlist("folder_upload")
                for uploaded in upload_sources:
                    suffix = Path(uploaded.name).suffix.lower()
                    if suffix not in (".txt", ".md"):
                        continue
                    try:
                        raw_bytes = uploaded.read()
                        text = raw_bytes.decode("utf-8")
                        collected_files.append((uploaded.name, text))
                    except Exception as exc:
                        file_read_errors.append(f"{uploaded.name}: {exc}")

                if not collected_files and not file_read_errors:
                    messages.warning(
                        request,
                        _("No .txt or .md files found in the specified source."),
                    )
                    return redirect("admin:ai_assistant_batch_upload")

                created_count = 0
                updated_count = 0
                skipped_count = 0
                index_error_count = 0
                total_chunks = 0

                for filename, text in collected_files:
                    title = extract_title_from_text(filename, text)
                    existing = KnowledgeDocument.objects.filter(title=title, language=language).first()

                    if existing and not overwrite:
                        skipped_count += 1
                        continue

                    if existing and overwrite:
                        doc = existing
                        doc.content = text
                        doc.status = "pending"
                        doc.error_message = ""
                        doc.file.save(filename, ContentFile(text.encode("utf-8")), save=False)
                        doc.save()
                        updated_count += 1
                    else:
                        doc = KnowledgeDocument(
                            title=title,
                            language=language,
                            content=text,
                            status="pending",
                        )
                        doc.file.save(filename, ContentFile(text.encode("utf-8")), save=False)
                        doc.save()
                        created_count += 1

                    if auto_index:
                        try:
                            chunks = index_knowledge_document(doc)
                            total_chunks += chunks
                        except Exception as exc:
                            logger.error("Auto-index failed for '%s': %s", doc.title, exc)
                            doc.status = "error"
                            doc.error_message = str(exc)
                            doc.save(update_fields=["status", "error_message"])
                            index_error_count += 1

                msg_parts = []
                if created_count:
                    msg_parts.append(_("created %(count)d documents") % {"count": created_count})
                if updated_count:
                    msg_parts.append(_("updated %(count)d documents") % {"count": updated_count})
                if total_chunks:
                    msg_parts.append(_("generated %(chunks)d chunks") % {"chunks": total_chunks})

                if msg_parts:
                    summary = ", ".join(msg_parts)
                    messages.success(request, _("Batch import completed: %(summary)s.") % {"summary": summary})

                if skipped_count:
                    messages.info(
                        request,
                        _("Skipped %(count)d existing documents (enable 'Overwrite' to replace them).") % {"count": skipped_count},
                    )
                if index_error_count:
                    messages.warning(
                        request,
                        _("Failed indexing %(count)d documents (status marked as 'error').") % {"count": index_error_count},
                    )
                if file_read_errors:
                    messages.warning(
                        request,
                        _("%(count)d files could not be read (check UTF-8 encoding).") % {"count": len(file_read_errors)},
                    )

                return redirect("admin:ai_assistant_knowledgedocument_changelist")
        else:
            form = BatchUploadForm()

        context = {
            **self.admin_site.each_context(request),
            "title": _("Batch Upload Knowledge Documents"),
            "form": form,
            "opts": self.model._meta,
        }
        return render(request, "admin/ai_assistant/knowledgedocument/batch_upload.html", context)

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
