'use client';

import { useRouter } from 'next/navigation';
import DocumentUpload from './DocumentUpload';

export default function DashboardUploader() {
    const router = useRouter();

    return (
        <DocumentUpload
            onUploadSuccess={() => {
                router.refresh();
            }}
        />
    );
}
