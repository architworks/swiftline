'use client';

import { Trash2 } from 'lucide-react';
import { deleteDocument } from '@/app/actions';
import { useTransition } from 'react';

export default function DeleteDocumentButton({ documentId, storagePath }: { documentId: string, storagePath: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to the Link parent

        if (confirm("Are you sure you want to delete this document?")) {
            startTransition(async () => {
                try {
                    await deleteDocument(documentId, storagePath);
                } catch {
                    alert('Failed to delete document');
                }
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className={`p-2 rounded-md hover:bg-red-50 hover:text-red-500 text-foreground/40 transition-colors z-10 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Delete Document"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
