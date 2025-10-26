
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { propertySchema } from '@/schemas';
import { revalidatePath } from 'next/cache';
import type { Property } from '@/lib/types';
import fetch from 'node-fetch';

// --- Helper Functions & Interfaces ---

interface MediaUploadResult {
  platform: string;
  success: boolean;
  error?: string;
  postUrl?: string;
}

const GRAPH_API_VERSION = 'v19.0';
const BASE_GRAPH_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function getPropertyImageUrls(supabase: any, propertyId: string): Promise<string[] | null> {
    const { data, error } = await supabase
        .from('property_media')
        .select('file_path')
        .eq('property_id', propertyId)
        .ilike('file_type', 'image/%');

    if (error || !data) {
        console.error('Could not fetch property images:', error?.message);
        return null;
    }
    return data.map(image => image.file_path);
}

// --- SIMULATED API Functions ---

async function postToFacebook(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
  console.log(`--- SIMULATING share to Facebook for "${property.title}" with ${imageUrls?.length || 0} images. ---`);
  // Use a valid base URL to avoid broken links
  const postUrl = `https://www.facebook.com/`;
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, platform: 'Facebook', postUrl };
}

async function postToInstagram(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
  console.log(`--- SIMULATING share to Instagram for "${property.title}" with ${imageUrls?.length || 0} images. ---`);
  // Use a valid base URL to avoid broken links
  const postUrl = `https://www.instagram.com/`;
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, platform: 'Instagram', postUrl };
}

async function shareTo99acres(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
  console.log(`--- SIMULATING share to 99acres for "${property.title}" with ${imageUrls?.length || 0} images. ---`);
  // Use a valid base URL to avoid broken links
  const listingUrl = `https://www.99acres.com/`;
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, platform: '99acres', postUrl: listingUrl };
}

async function shareToOlx(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
  console.log(`--- SIMULATING share to OLX for "${property.title}" with ${imageUrls?.length || 0} images. ---`);
  // Use a valid base URL to avoid broken links
  const listingUrl = `https://www.olx.in/`;
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, platform: 'OLX', postUrl: listingUrl };
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

  const rawData = Object.fromEntries(formData.entries());
  
  const validatedFields = propertySchema.safeParse({
    ...rawData,
    price: rawData.price ? Number(rawData.price) : undefined,
    bedrooms: rawData.bedrooms ? Number(rawData.bedrooms) : undefined,
    bathrooms: rawData.bathrooms ? Number(rawData.bathrooms) : undefined,
    area_sqft: rawData.area_sqft ? Number(rawData.area_sqft) : undefined,
    property_type: rawData.property_type || 'Residential',
  });

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
      const { data, error } = await supabase
        .from('properties')
        .update({ ...validatedFields.data, updated_at: new Date().toISOString() })
        .eq('id', propertyId)
        .select()
        .single();
      if (error) throw error;
      savedProperty = data;
    } else {
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

    if (!propertyId && savedProperty && platformsToShare.length > 0) {
      console.log(`Property created. Sharing to: ${platformsToShare.join(', ')}`);
      
      const imageUrls = await getPropertyImageUrls(supabase, savedProperty.id);
      const sharingPromises: Promise<MediaUploadResult>[] = [];

      if (platformsToShare.includes('99acres')) sharingPromises.push(shareTo99acres(savedProperty, imageUrls));
      if (platformsToShare.includes('olx')) sharingPromises.push(shareToOlx(savedProperty, imageUrls));
      if (platformsToShare.includes('instagram')) sharingPromises.push(postToInstagram(savedProperty, imageUrls));
      if (platformsToShare.includes('facebook')) sharingPromises.push(postToFacebook(savedProperty, imageUrls));
      
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
