
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

// --- API Integration Functions (Real Implementation) ---

async function postToFacebook(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    return { success: false, platform: 'Facebook', error: 'Facebook Page ID or Access Token is not configured.' };
  }
  if (!imageUrls || imageUrls.length === 0) {
    return { success: false, platform: 'Facebook', error: 'At least one image is required for Facebook.' };
  }

  const caption = `${property.title}\n\n${property.description}\n\nPrice: ₹${property.price.toLocaleString()}\nLocation: ${property.city}, ${property.state}\n\n#realestate #${property.city.replace(/\s+/g, '')} #${property.property_type}`;

  try {
    const uploadedPhotoIds: string[] = [];
    for (const imageUrl of imageUrls) {
      const uploadResponse = await fetch(`${BASE_GRAPH_URL}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          published: false, // Important for multi-photo posts
          access_token: accessToken,
        }),
      });
      const uploadResult = await uploadResponse.json() as { id?: string; error?: any };
      if (!uploadResponse.ok || !uploadResult.id) {
        throw new Error(`Failed to upload photo: ${uploadResult.error?.message || 'Unknown error'}`);
      }
      uploadedPhotoIds.push(uploadResult.id);
    }
    
    // Create the post with the uploaded (but unpublished) photos
    const postResponse = await fetch(`${BASE_GRAPH_URL}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: caption,
        attached_media: uploadedPhotoIds.map(id => ({ media_fbid: id })),
        access_token: accessToken,
      }),
    });

    const postResult = await postResponse.json() as { id?: string; error?: any };
    if (!postResponse.ok || !postResult.id) {
        throw new Error(`Failed to create Facebook post: ${postResult.error?.message || 'Unknown error'}`);
    }
    
    const postUrl = `https://www.facebook.com/${postResult.id}`;
    return { success: true, platform: 'Facebook', postUrl };

  } catch (error: any) {
    console.error('[Facebook Sharing Error]', error);
    return { success: false, platform: 'Facebook', error: error.message };
  }
}

async function postToInstagram(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!igUserId || !accessToken) {
    return { success: false, platform: 'Instagram', error: 'Instagram Account ID or Access Token is not configured.' };
  }
  if (!imageUrls || imageUrls.length === 0) {
    return { success: false, platform: 'Instagram', error: 'At least one image is required for Instagram.' };
  }

  const caption = `${property.title}\n\n${property.description}\n\nPrice: ₹${property.price.toLocaleString()}\nLocation: ${property.city}, ${property.state}\n\n#realestate #${property.city.replace(/\s+/g, '')} #${property.property_type} #propertyforsale`;
  
  try {
    // 1. Upload media items and get container IDs
    const containerIds: string[] = [];
    for (const imageUrl of imageUrls) {
      const uploadResponse = await fetch(`${BASE_GRAPH_URL}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption, // Caption is needed here for single image posts
          access_token: accessToken,
        }),
      });
      const uploadResult = await uploadResponse.json() as { id?: string; error?: any };
      if (!uploadResponse.ok || !uploadResult.id) {
          throw new Error(`Failed to upload to Instagram container: ${uploadResult.error?.message || 'Unknown error'}`);
      }
      containerIds.push(uploadResult.id);
    }
    
    let finalContainerId: string;
    // 2. If more than one image, create a carousel container
    if (containerIds.length > 1) {
        const carouselResponse = await fetch(`${BASE_GRAPH_URL}/${igUserId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                media_type: 'CAROUSEL',
                caption: caption,
                children: containerIds,
                access_token: accessToken,
            }),
        });
        const carouselResult = await carouselResponse.json() as { id?: string; error?: any };
         if (!carouselResponse.ok || !carouselResult.id) {
            throw new Error(`Failed to create Instagram carousel container: ${carouselResult.error?.message || 'Unknown error'}`);
        }
        finalContainerId = carouselResult.id;
    } else {
        finalContainerId = containerIds[0];
    }

    // 3. Publish the container
    const publishResponse = await fetch(`${BASE_GRAPH_URL}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            creation_id: finalContainerId,
            access_token: accessToken,
        }),
    });
    
    const publishResult = await publishResponse.json() as { id?: string; error?: any };
    if (!publishResponse.ok || !publishResult.id) {
        throw new Error(`Failed to publish to Instagram: ${publishResult.error?.message || 'Unknown error'}`);
    }

    // The ID returned here is a media ID, not a post ID. We need another call to get the permalink.
    const permalinkResponse = await fetch(`${BASE_GRAPH_URL}/${publishResult.id}?fields=permalink&access_token=${accessToken}`);
    const permalinkResult = await permalinkResponse.json() as { permalink?: string };
    
    return { success: true, platform: 'Instagram', postUrl: permalinkResult.permalink || `https://www.instagram.com/p/${publishResult.id}` };

  } catch (error: any) {
    console.error('[Instagram Sharing Error]', error);
    return { success: false, platform: 'Instagram', error: error.message };
  }
}

// Placeholder functions for platforms not yet implemented
async function shareTo99acres(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
  console.log(`SIMULATING share to 99acres for "${property.title}" with ${imageUrls?.length || 0} images.`);
  const listingUrl = `https://www.99acres.com/property-in-${property.city.toLowerCase().replace(/\s+/g, '-')}-i${Math.floor(Math.random() * 100000)}`;
  return { success: true, platform: '99acres', postUrl: listingUrl };
}

async function shareToOlx(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
  console.log(`SIMULATING share to OLX for "${property.title}" with ${imageUrls?.length || 0} images.`);
  const listingUrl = `https://www.olx.in/item/${property.title.toLowerCase().replace(/\s+/g, '-')}-iid-${Math.floor(Math.random() * 10000000)}`;
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
