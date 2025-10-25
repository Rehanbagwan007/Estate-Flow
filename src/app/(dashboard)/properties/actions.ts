'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { propertySchema } from '@/schemas';
import { revalidatePath } from 'next/cache';
import type { Property } from '@/lib/types';

// --- Helper Functions & Interfaces ---

interface MediaUploadResult {
  platform: string;
  success: boolean;
  error?: string;
  postUrl?: string; // Will hold the URL of the created post
}

// A helper to fetch the first image URL associated with a property
async function getFirstPropertyImage(supabase: any, propertyId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('property_media')
        .select('file_path')
        .eq('property_id', propertyId)
        .ilike('file_type', 'image/%')
        .limit(1)
        .single();

    if (error || !data) {
        console.error('Could not fetch property image:', error?.message);
        return null;
    }
    return data.file_path;
}


// --- API Integration Functions (Placeholders) ---

async function shareTo99acres(property: Property): Promise<MediaUploadResult> {
  console.log('Attempting to share to 99acres...', property.title);
  // The real API response should give you a URL to the new listing.
  const listingUrl = `https://www.99acres.com/property-in-${property.city.toLowerCase()}-${property.id}`;
  return { success: true, platform: '99acres', postUrl: listingUrl };
}

async function shareToOlx(property: Property): Promise<MediaUploadResult> {
  console.log('Attempting to share to OLX...', property.title);
  const listingUrl = `https://www.olx.in/item/${property.title.toLowerCase().replace(/\s+/g, '-')}-iid-12345${property.id}`;
  return { success: true, platform: 'OLX', postUrl: listingUrl };
}

async function postToInstagram(property: Property, imageUrl: string | null): Promise<MediaUploadResult> {
  console.log('Attempting to post to Instagram...', property.title);
  if (!imageUrl) {
    return { success: false, platform: 'Instagram', error: 'An image is required.' };
  }
  // After a successful post, the API returns an ID. The permalink needs to be fetched or constructed.
  const postId = `Cq_Z_${Math.random().toString(36).substring(2, 10)}`;
  const postUrl = `https://www.instagram.com/p/${postId}/`;
  return { success: true, platform: 'Instagram', postUrl };
}

async function postToFacebook(property: Property, imageUrl: string | null): Promise<MediaUploadResult> {
    console.log('Attempting to post to Facebook...', property.title);
    if (!imageUrl) {
        return { success: false, platform: 'Facebook', error: 'An image is required.' };
    }
    // The API response returns an ID in the format `pageId_postId`.
    const pageId = process.env.FACEBOOK_PAGE_ID || '1234567890';
    const postId = `8765432109`;
    const postUrl = `https://www.facebook.com/${pageId}/posts/${postId}`;
    return { success: true, platform: 'Facebook', postUrl };
}


// --- Main Server Action ---
export async function saveProperty(
  prevState: { message: string; success?: boolean },
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: 'Authentication required.' };
  }

  const validatedFields = propertySchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data. ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const files = formData.getAll('files') as File[];
  const propertyId = formData.get('id') as string | null;
  const platformsToShare = formData.getAll('share_platforms') as string[];

  let savedProperty: Property | null = null;

  try {
    if (propertyId) {
      // Update existing property
      const { data, error } = await supabase
        .from('properties')
        .update({ ...validatedFields.data, updated_at: new Date().toISOString() })
        .eq('id', propertyId)
        .select()
        .single();
      if (error) throw error;
      savedProperty = data;
    } else {
      // Create new property
      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...validatedFields.data,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      savedProperty = data;
    }

    if (!savedProperty) {
      throw new Error('Failed to save property details.');
    }
    
    // Handle file uploads
    if (files.length > 0 && files[0].size > 0) {
      for (const file of files) {
        const filePath = `${user.id}/property_media/${savedProperty.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('property_media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload Error:', uploadError.message);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('property_media')
          .getPublicUrl(filePath);

        await supabase.from('property_media').insert({
          property_id: savedProperty.id,
          file_path: urlData.publicUrl,
          file_type: file.type,
        });
      }
    }

    // --- CONDITIONAL SHARING & SAVING URLS (ON CREATION ONLY) ---
    if (!propertyId && savedProperty && platformsToShare.length > 0) {
      console.log(`Property created. Sharing to: ${platformsToShare.join(', ')}`);
      
      const firstImageUrl = await getFirstPropertyImage(supabase, savedProperty.id);
      const sharingPromises: Promise<MediaUploadResult>[] = [];

      if (platformsToShare.includes('99acres')) sharingPromises.push(shareTo99acres(savedProperty));
      if (platformsToShare.includes('olx')) sharingPromises.push(shareToOlx(savedProperty));
      if (platformsToShare.includes('instagram')) sharingPromises.push(postToInstagram(savedProperty, firstImageUrl));
      if (platformsToShare.includes('facebook')) sharingPromises.push(postToFacebook(savedProperty, firstImageUrl));
      
      // Process results in the background
      Promise.allSettled(sharingPromises).then(async (results) => {
          console.log('--- Social Sharing Complete ---');
          const sharesToSave = [];

          for (const result of results) {
              if (result.status === 'fulfilled' && result.value.success && result.value.postUrl) {
                  console.log(`✅ ${result.value.platform}: Success | URL: ${result.value.postUrl}`);
                  sharesToSave.push({
                      property_id: savedProperty!.id,
                      platform: result.value.platform,
                      post_url: result.value.postUrl,
                      shared_by: user.id
                  });
              } else if (result.status === 'fulfilled' && !result.value.success) {
                  console.error(`❌ ${result.value.platform} Failed: ${result.value.error}`);
              } else if (result.status === 'rejected') {
                  console.error(`❌ Sharing Failed Hard:`, result.reason);
              }
          }

          if (sharesToSave.length > 0) {
            console.log(`Saving ${sharesToSave.length} share URLs to the database...`);
            const { error } = await supabase.from('property_shares').insert(sharesToSave);
            if (error) {
                console.error('Error saving share URLs to database:', error.message);
            } else {
                console.log('Successfully saved share URLs.');
            }
          }
      });
    }

  } catch (error) {
    console.error(error)
    let message = 'An unknown error occurred';
    if (error instanceof Error) {
      message = error.message;
    }
    return { message: `Database Error: ${message}` };
  }

  revalidatePath('/(dashboard)/properties');
  
  return {
    success: true,
    message: propertyId ? 'Property updated successfully!' : 'Property created and sharing has started!',
  };
}

    