import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import styled from 'styled-components';

// Configure PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentViewerProps {
  documentUrl: string;
  pageNumbers?: number[]; // Optional: specific page numbers to display
  fileName: string; // For accessibility and potential download (though read-only)
}

interface PdfError {
  name: string;
  message: string;
}

const ViewerContainer = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-x: auto; /* Allows horizontal scrolling for wide PDFs on smaller screens */
  background-color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const PageContainer = styled.div`
  background-color: white;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px; /* Space between pages */
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 10px;
  border-radius: 4px;

  canvas {
    max-width: 100%;
    height: auto !important; /* Ensure canvas scales responsively */
    display: block; /* Remove extra space below canvas */
  }
`;

const PageLabel = styled.div`
  font-size: 0.9em;
  color: #555;
  margin-top: 5px;
  margin-bottom: 10px;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  font-size: 1em;
  margin: 20px 0;
  width: 100%;
  max-width: 600px;
`;

const LoadingMessage = styled.div`
  padding: 20px;
  font-size: 1.1em;
  color: #333;
  text-align: center;
`;

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentUrl, pageNumbers, fileName }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }): void => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: PdfError): void => {
    console.error('Failed to load PDF document:', error);
    setLoading(false);
    setError(`Failed to load document: ${error.message}. Please try again later.`);
  }, []);

  const onPageRenderError = useCallback((error: PdfError): void => {
    console.error('Failed to render PDF page:', error);
    // Optionally, set a page-specific error or a general error if rendering fails
    // For now, we'll let the document load error handle major issues.
  }, []);

  // Handle responsiveness: adjust page width based on container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Subtract padding to get actual content width for PDF rendering
        setContainerWidth(containerRef.current.offsetWidth - 40); // 20px padding on each side
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const effectivePageNumbers = (() => {
    if (pageNumbers && pageNumbers.length > 0) {
      return pageNumbers;
    }
    // Only if pageNumbers is not provided or empty, apply special logic for 'Finance Policy document.pdf'
    if (fileName === 'Finance Policy document.pdf') {
      return [5, 19]; // Specific pages for the flowchart
    }
    return Array.from({ length: numPages || 0 }, (_, i) => i + 1);
  })();

  if (loading) {
    return <LoadingMessage aria-live="polite">Loading document "{fileName}"...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage role="alert">{error}</ErrorMessage>;
  }

  if (!numPages && !effectivePageNumbers.length) {
    return <ErrorMessage role="alert">No document found or failed to load. Please check the URL.</ErrorMessage>;
  }

  return (
    <ViewerContainer ref={containerRef} aria-label={`Document Viewer for ${fileName}`}>
      <Document
        file={documentUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<LoadingMessage aria-live="polite">Preparing document pages...</LoadingMessage>}
        error={<ErrorMessage role="alert">Error loading PDF document.</ErrorMessage>}
        noData={<ErrorMessage role="alert">No PDF file specified.</ErrorMessage>}
        // Options to prevent download/print via PDF.js viewer controls (though browser controls might still exist)
        options={{
          cMapUrl: `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
          disableStream: true, // Helps with some cross-origin issues
          disableAutoFetch: true, // Helps with some cross-origin issues
          // This is a read-only viewer, so we don't want interactive forms or annotations
          // However, these are typically handled by the rendering library itself, not options.
        }}
      >
        {effectivePageNumbers.map((pageNumber) => (
          <PageContainer key={`page_${pageNumber}`}>
            <Page
              pageNumber={pageNumber}
              width={containerWidth > 0 ? Math.min(containerWidth, 900) : undefined} // Max width for readability
              renderTextLayer={true}
              renderAnnotationLayer={true}
              onRenderError={onPageRenderError}
              loading={<LoadingMessage aria-live="polite">Loading page {pageNumber}...</LoadingMessage>}
              error={<ErrorMessage role="alert">Error rendering page {pageNumber}.</ErrorMessage>}
            />
            <PageLabel aria-hidden="true">Page {pageNumber} of {numPages || '...'}</PageLabel>
          </PageContainer>
        ))}
      </Document>
    </ViewerContainer>
  );
};

export default DocumentViewer;