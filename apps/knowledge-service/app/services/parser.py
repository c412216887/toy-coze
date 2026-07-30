import io
from pathlib import Path
import structlog

logger = structlog.get_logger()


class DocumentParser:

    def parse(self, content: bytes, filename: str) -> str:
        ext = Path(filename).suffix.lower().lstrip('.')
        if ext == 'pdf':
            return self._parse_pdf(content)
        if ext in ('docx', 'doc'):
            return self._parse_docx(content)
        if ext in ('md', 'txt'):
            return content.decode('utf-8', errors='replace')
        raise ValueError(f'不支持的文件类型: {ext}')

    def _parse_pdf(self, content: bytes) -> str:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text.strip())
        return '\n\n'.join(pages)

    def _parse_docx(self, content: bytes) -> str:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return '\n\n'.join(paragraphs)
