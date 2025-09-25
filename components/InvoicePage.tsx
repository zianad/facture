import React, { useState } from 'react';

const InvoicePage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setExtractedData(null);
            setError(null);
        }
    };

    const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const handleAnalyze = async () => {
        if (!file) {
            alert('Please select a file first.');
            return;
        }

        setIsProcessing(true);
        setExtractedData(null);
        setError(null);

        try {
            const base64Image = await toBase64(file);
            const response = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image,
                    mimeType: file.type,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to analyze image');
            }

            const data = await response.json();
            setExtractedData(data);
        } catch (err: any) {
            console.error('Error analyzing invoice:', err);
            setError(err.message || 'An error occurred while analyzing the invoice.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div>
            <h1>Invoices</h1>
            <p>Upload an invoice image to extract data using Gemini.</p>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleAnalyze} disabled={!file || isProcessing}>
                {isProcessing ? 'Analyzing...' : 'Analyze Invoice'}
            </button>

            {error && <div style={{ color: 'red' }}>Error: {error}</div>}

            {extractedData && (
                <div>
                    <h2>Extracted Data</h2>
                    <pre>{JSON.stringify(extractedData, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default InvoicePage;
