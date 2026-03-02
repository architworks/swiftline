'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { extractDocumentWords } from '@/utils/parsing';
import { createClient } from '@/utils/supabase/client';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function DocumentUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: ''
    });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        const file = acceptedFiles[0];

        setIsUploading(true);
        setStatus({ type: 'idle', message: 'Parsing document...' });

        try {
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Parse content client-side
            const words = await extractDocumentWords(file);
            if (words.length === 0) throw new Error("Could not extract any text from the document.");

            setStatus({ type: 'idle', message: 'Uploading file to storage...' });

            // 2. Upload original file to Supabase Storage
            const fileId = uuidv4();
            const storagePath = `${user.id}/${fileId}_${file.name}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(storagePath, file);

            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                throw new Error(uploadError.message || "Failed to upload file to storage");
            }

            setStatus({ type: 'idle', message: 'Saving document metadata...' });

            // 3. Insert into Documents table
            const { data: docData, error: docError } = await supabase
                .from('documents')
                .insert({
                    id: fileId,
                    user_id: user.id,
                    title: file.name,
                    total_word_count: words.length,
                    storage_path: storagePath
                })
                .select()
                .single();

            if (docError) throw new Error("Failed to create document record");

            // 4. Insert into Document_Contents table
            const { error: contentError } = await supabase
                .from('document_contents')
                .insert({
                    id: fileId,
                    user_id: user.id,
                    content_array: words // JSONB handles the array transparently
                });

            if (contentError) throw new Error("Failed to save parsed document contents");

            // Initialize Reading Progress
            await supabase
                .from('reading_progress')
                .insert({
                    document_id: fileId,
                    user_id: user.id,
                    current_word_index: 0,
                    percent_complete: 0
                });

            setStatus({ type: 'success', message: 'Document uploaded successfully!' });
            setTimeout(() => {
                onUploadSuccess();
                setStatus({ type: 'idle', message: '' });
            }, 2000);

        } catch (error: any) {
            console.error(error);
            setStatus({ type: 'error', message: error.message || 'An error occurred during upload' });
        } finally {
            setIsUploading(false);
        }
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/epub+zip': ['.epub'],
            'text/plain': ['.txt'],
            'text/markdown': ['.md']
        },
        maxFiles: 1,
        disabled: isUploading
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 
          ${isDragActive ? 'border-blue-500 bg-blue-50/10' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/5'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-4 text-foreground/70">
                    <UploadCloud className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    {isDragActive ? (
                        <p className="text-lg font-medium">Drop the document here ...</p>
                    ) : (
                        <div>
                            <p className="text-lg font-medium mb-1">Drag & drop a document here, or click to select</p>
                            <p className="text-sm">Supports PDF, DOCX, EPUB, TXT, MD</p>
                        </div>
                    )}
                </div>
            </div>

            {status.message && (
                <div className={`mt-4 p-4 rounded-md flex items-center gap-3
          ${status.type === 'error' ? 'bg-red-50 text-red-700' : ''}
          ${status.type === 'success' ? 'bg-green-50 text-green-700' : ''}
          ${status.type === 'idle' ? 'bg-blue-50 text-blue-700' : ''}
        `}>
                    {status.type === 'idle' && <Loader2 className="w-5 h-5 animate-spin" />}
                    {status.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                    {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium text-sm">{status.message}</span>
                </div>
            )}
        </div>
    );
}
