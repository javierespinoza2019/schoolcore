import { useEffect, useState } from 'react';
import { apiDownload } from '@/api/apiClient';
import { isGuid } from '@/api/helpers';

interface TeacherAvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
  filenameHint?: string;
}

function isDirectImageSrc(value: string): boolean {
  return (
    value.startsWith('data:image/') ||
    value.startsWith('blob:') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  );
}

/** Muestra foto de profesor: data/http directo, o GUID de /documents/{id}/download. */
export default function TeacherAvatar({ src, alt, className, filenameHint = 'photo' }: TeacherAvatarProps) {
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    const value = (src ?? '').trim();
    if (!value || isDirectImageSrc(value) || !isGuid(value)) {
      setBlobUrl('');
      return;
    }

    let revoked = false;
    let objectUrl = '';
    void apiDownload(`/documents/${value}/download`, { filenameHint }).then((file) => {
      if (!file) return;
      const url = URL.createObjectURL(file.blob);
      if (revoked) {
        URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setBlobUrl(url);
    });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  const value = (src ?? '').trim();
  const display = !value
    ? ''
    : isDirectImageSrc(value)
      ? value
      : isGuid(value)
        ? blobUrl
        : '';

  if (!display) {
    return (
      <div
        className={`flex items-center justify-center bg-secondary-100 text-foreground-400 ${className ?? ''}`}
        aria-label={alt}
      >
        <i className="ri-user-line" />
      </div>
    );
  }

  return <img src={display} alt={alt} className={className} />;
}
