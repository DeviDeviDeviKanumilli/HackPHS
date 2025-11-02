// Image upload endpoint using Cloudinary
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/errorHandler';
import { logInfo, logError } from '@/lib/logger';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

// Supported image formats
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(
  file: File,
  folder: string = 'sproutshare'
): Promise<{ url: string; publicId: string }> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError(
      'Image upload service not configured',
      500,
      'UPLOAD_SERVICE_ERROR'
    );
  }

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const dataURI = `data:${file.type};base64,${base64}`;

  // Upload to Cloudinary
  const formData = new FormData();
  formData.append('file', dataURI);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'sproutshare');
  formData.append('folder', folder);
  formData.append('resource_type', 'image');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    logError(new Error(`Cloudinary upload failed: ${error}`));
    throw new AppError('Failed to upload image', 500, 'UPLOAD_FAILED');
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'sproutshare';

    if (!file) {
      throw new AppError('No file provided', 400, 'NO_FILE');
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new AppError(
        `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    logInfo('Uploading image', {
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, folder);

    logInfo('Image uploaded successfully', {
      userId: user.id,
      url: result.url,
      publicId: result.publicId,
    });

    return NextResponse.json(
      {
        url: result.url,
        publicId: result.publicId,
        message: 'Image uploaded successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/upload',
    });
  }
}

/**
 * Delete image from Cloudinary
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { publicId } = await request.json();

    if (!publicId) {
      throw new AppError('Public ID required', 400, 'NO_PUBLIC_ID');
    }

    if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new AppError(
        'Image upload service not configured',
        500,
        'UPLOAD_SERVICE_ERROR'
      );
    }

    // Generate signature for authenticated delete
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = require('crypto')
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
      .digest('hex');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          timestamp,
          signature,
          api_key: CLOUDINARY_API_KEY,
        }),
      }
    );

    if (!response.ok) {
      throw new AppError('Failed to delete image', 500, 'DELETE_FAILED');
    }

    logInfo('Image deleted successfully', {
      userId: user.id,
      publicId,
    });

    return NextResponse.json(
      { message: 'Image deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/upload',
    });
  }
}

