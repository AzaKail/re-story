import logging
from pathlib import Path
from typing import Any, List
from django import forms
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from .models import KnowledgeDocument

logger = logging.getLogger(__name__)


class MultipleFileInput(forms.FileInput):
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)

    def clean(self, data: Any, initial: Any = None) -> Any:
        single_file_clean = super().clean
        if isinstance(data, (list, tuple)):
            return [single_file_clean(d, initial) for d in data]
        return single_file_clean(data, initial)


class BatchUploadForm(forms.Form):
    language = forms.ChoiceField(
        choices=KnowledgeDocument.LANGUAGE_CHOICES,
        initial="en",
        label=_("Language"),
        help_text=_("Language of the documents to import (used for RAG multilingual search)."),
    )
    folder_path = forms.CharField(
        required=False,
        label=_("Server Folder Path"),
        widget=forms.TextInput(
            attrs={
                "class": "vTextField",
                "placeholder": "e.g. data/docs or D:/knowledge/en",
                "style": "width: 100%; max-width: 600px;",
            }
        ),
        help_text=_(
            "Specify a directory path on the server (absolute or relative to project root). "
            "All .txt and .md files inside it (and subfolders) will be imported."
        ),
    )
    files = MultipleFileField(
        required=False,
        widget=MultipleFileInput(attrs={"multiple": True}),
        label=_("Or Select Files from Computer"),
        help_text=_("Select one or multiple .txt / .md files from your computer."),
    )
    folder_upload = MultipleFileField(
        required=False,
        widget=MultipleFileInput(attrs={"webkitdirectory": "true", "directory": "true", "multiple": True}),
        label=_("Or Select an Entire Folder from Computer"),
        help_text=_("Select an entire local folder using your browser's folder selector."),
    )
    auto_index = forms.BooleanField(
        required=False,
        initial=True,
        label=_("Index documents immediately"),
        help_text=_("Automatically split imported text into chunks and generate vector embeddings right away."),
    )
    overwrite = forms.BooleanField(
        required=False,
        initial=False,
        label=_("Overwrite existing documents"),
        help_text=_("If checked, existing documents with matching titles and language will be updated instead of skipped."),
    )

    def clean(self) -> dict[str, Any]:
        cleaned_data = super().clean()
        folder_path = (cleaned_data.get("folder_path") or "").strip()
        files = self.files.getlist("files")
        folder_files = self.files.getlist("folder_upload")

        if not folder_path and not files and not folder_files:
            raise forms.ValidationError(
                _("Please provide at least one source: specify a server folder path, choose files, or select a folder.")
            )

        if folder_path:
            p = Path(folder_path)
            if not p.is_absolute():
                p = Path(settings.BASE_DIR) / p

            if not p.exists():
                raise forms.ValidationError(
                    _("The specified server folder does not exist: %(path)s") % {"path": str(p)}
                )
            if not p.is_dir():
                raise forms.ValidationError(
                    _("The specified server path is not a directory: %(path)s") % {"path": str(p)}
                )

            cleaned_data["resolved_folder_path"] = p

        return cleaned_data
