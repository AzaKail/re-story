from typing import Any
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import connection, models
from django.utils.translation import gettext_lazy as _
from pgvector import Vector
from pgvector.django import VectorField


def check_native_pgvector() -> bool:
    """Check if the native pgvector C extension is loaded into PostgreSQL."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
            return bool(cursor.fetchone())
    except Exception:
        return False


class AdaptiveVectorField(VectorField):
    """
    VectorField that supports native pgvector when installed, and gracefully
    adapts to a PostgreSQL domain or array type when the C extension is not present.
    """

    description = "Adaptive Vector"

    def __init__(self, *args: Any, dimensions: int | None = None, **kwargs: Any) -> None:
        super().__init__(*args, dimensions=dimensions, **kwargs)

    def db_type(self, connection: Any) -> str:
        if check_native_pgvector() and self.dimensions is not None:
            return f"vector({self.dimensions})"
        return "vector"

    def get_prep_value(self, value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            return value
        if check_native_pgvector():
            return Vector._to_db(value)
        # PostgreSQL domain over real[] expects array format '{x,y,z}'
        formatted = ",".join(str(float(x)) for x in value)
        return f"{{{formatted}}}"

    def from_db_value(self, value: Any, expression: Any, connection: Any) -> list[float] | None:
        if value is None:
            return None
        if isinstance(value, list):
            return [float(x) for x in value]
        if isinstance(value, str):
            cleaned = value.strip("{}[]")
            if not cleaned:
                return []
            return [float(x.strip()) for x in cleaned.split(",")]
        return Vector._from_db(value)

    def to_python(self, value: Any) -> list[float] | None:
        if value is None:
            return None
        if isinstance(value, list):
            return [float(x) for x in value]
        if isinstance(value, str):
            cleaned = value.strip("{}[]")
            if not cleaned:
                return []
            return [float(x.strip()) for x in cleaned.split(",")]
        return Vector._from_db(value)


def validate_file_utf8(file_obj: Any) -> None:
    """Validate that the uploaded file is valid UTF-8 text."""
    try:
        content = file_obj.read()
        content.decode("utf-8")
        file_obj.seek(0)
    except UnicodeDecodeError:
        file_obj.seek(0)
        raise ValidationError(_("The file must be encoded in UTF-8."))
    except Exception as exc:
        file_obj.seek(0)
        raise ValidationError(_("Unable to read file: %(error)s") % {"error": str(exc)})


class KnowledgeDocument(models.Model):
    """Source document for the AIstronaut knowledge base."""

    LANGUAGE_CHOICES = [
        ("en", _("English")),
        ("ru", _("Russian")),
        ("kk", _("Kazakh")),
    ]

    STATUS_CHOICES = [
        ("pending", _("Pending")),
        ("indexed", _("Indexed")),
        ("error", _("Error")),
    ]

    title = models.CharField(max_length=255, verbose_name=_("Title"))
    file = models.FileField(
        upload_to="knowledge_documents/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=["txt", "md"]), validate_file_utf8],
        verbose_name=_("File (.txt, .md)"),
        help_text=_("Upload a .txt or .md file encoded in UTF-8, or enter text directly below."),
    )
    content = models.TextField(
        blank=True,
        default="",
        verbose_name=_("Text Content"),
        help_text=_("Direct text entry. If a file is uploaded, file content takes precedence."),
    )
    language = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default="en",
        verbose_name=_("Language"),
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name=_("Indexing Status"),
    )
    error_message = models.TextField(
        blank=True,
        default="",
        verbose_name=_("Error Message"),
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))

    class Meta:
        verbose_name = _("Knowledge Document")
        verbose_name_plural = _("Knowledge Documents")
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.title} [{self.get_language_display()}]"

    def clean(self) -> None:
        super().clean()
        if not self.file and not self.content.strip():
            raise ValidationError(_("Either a file or text content must be provided."))

    def get_raw_text(self) -> str:
        """Extract plain text from uploaded file or direct text field."""
        if self.file:
            try:
                self.file.open("rb")
                raw_bytes = self.file.read()
                self.file.close()
                return raw_bytes.decode("utf-8").strip()
            except Exception:
                pass
        return self.content.strip()


class DocumentChunk(models.Model):
    """Indexed boundary text chunk with vector embedding."""

    document = models.ForeignKey(
        KnowledgeDocument,
        on_delete=models.CASCADE,
        related_name="chunks",
        verbose_name=_("Document"),
    )
    chunk_index = models.PositiveIntegerField(verbose_name=_("Chunk Index"))
    content = models.TextField(verbose_name=_("Chunk Content"))
    embedding = AdaptiveVectorField(
        dimensions=768,
        null=True,
        blank=True,
        verbose_name=_("Embedding Vector"),
    )

    class Meta:
        verbose_name = _("Document Chunk")
        verbose_name_plural = _("Document Chunks")
        ordering = ["document", "chunk_index"]
        unique_together = [("document", "chunk_index")]

    def __str__(self) -> str:
        return f"{self.document.title} - chunk #{self.chunk_index}"
