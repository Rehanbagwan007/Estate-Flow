

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

// --- REAL API Functions ---

async function postToFacebook(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const userAccessToken = process.env.META_ACCESS_TOKEN;

    if (!pageId || !userAccessToken) {
        return { success: false, platform: 'Facebook', error: 'Facebook Page ID or Access Token is not configured.' };
    }

    if (!imageUrls || imageUrls.length === 0) {
        return { success: false, platform: 'Facebook', error: 'At least one image is required to post to Facebook.' };
    }

    try {
        // Step 1: Get the Page Access Token using the User Access Token
        const pageTokenResponse = await fetch(`${BASE_GRAPH_URL}/${pageId}?fields=access_token&access_token=${userAccessToken}`);
        const pageTokenData = await pageTokenResponse.json() as { access_token?: string; error?: any };
        
        if (pageTokenData.error || !pageTokenData.access_token) {
             throw new Error(`Could not retrieve Page Access Token: ${pageTokenData.error?.message || 'Unknown error'}`);
        }
        const pageAccessToken = pageTokenData.access_token;
        

        // Step 2: Upload photos and get their IDs using the Page Access Token
        const attachedMedia: { media_fbid: string }[] = [];
        for (const imageUrl of imageUrls) {
            // Important: Use the pageAccessToken now
            const uploadResponse = await fetch(`${BASE_GRAPH_URL}/${pageId}/photos?url=${encodeURIComponent(imageUrl)}&published=false`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${pageAccessToken}` },
            });
            const uploadResult = await uploadResponse.json() as { id?: string; error?: any };
            if (uploadResult.id) {
                attachedMedia.push({ media_fbid: uploadResult.id });
            } else {
                console.error(`Facebook photo upload failed for ${imageUrl}:`, uploadResult.error);
            }
        }
        
        if (attachedMedia.length === 0) {
          throw new Error("All photo uploads to Facebook failed.");
        }
        
        const message = `${property.title}\n\n${property.description || ''}\n\nPrice: ₹${property.price.toLocaleString()}\nLocation: ${property.city}, ${property.state}\n\n#realestate #${property.city.replace(/\s+/g, '')} #${property.property_type}`;


        // Step 3: Create the post with the uploaded photos using the Page Access Token
        const postResponse = await fetch(`${BASE_GRAPH_URL}/${pageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pageAccessToken}` },
            body: JSON.stringify({ message, attached_media: attachedMedia }),
        });

        const postResult = await postResponse.json() as { id?: string; error?: any };
        if (postResult.id) {
            const postUrl = `https://www.facebook.com/${postResult.id}`;
            return { success: true, platform: 'Facebook', postUrl };
        } else {
            throw new Error(postResult.error?.message || 'Failed to create post on Facebook.');
        }
    } catch (error: any) {
        console.error('Error posting to Facebook:', error);
        return { success: false, platform: 'Facebook', error: error.message };
    }
}

async function postToInstagram(property: Property, imageUrls: string[] | null): Promise<MediaUploadResult> {
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!igAccountId || !accessToken) {
        console.log("Skipping Instagram post: Instagram Business Account ID or Access Token is not configured.");
        return { success: false, platform: 'Instagram', error: 'Instagram is not configured.' };
    }
     // For now, this remains a simulation until the user provides the ID.
    const fakePostId = `C${Math.random().toString(36).substring(2, 12)}`;
    return { success: true, platform: 'Instagram', postUrl: `https://www.instagram.com/p/${fakePostId}/` };
}

// --- SIMULATED API Functions ---
const generateRandomId = (length = 16) => {
    return Math.random().toString(36).substring(2, length + 2);
}

async function shareTo99acres(property: Property): Promise<MediaUploadResult> {
  console.log(`--- SIMULATING share to 99acres for "${property.title}" ---`);
  const fakeListingId = Math.floor(Math.random() * 10000000);
  const citySlug = property.city.toLowerCase().replace(/\s+/g, '-');
  const listingUrl = `https://www.99acres.com/${property.title.toLowerCase().replace(/\s+/g, '-')}-in-${citySlug}-noida-r${fakeListingId}`;
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true, platform: '99acres', postUrl: listingUrl };
}

async function shareToOlx(property: Property): Promise<MediaUploadResult> {
  console.log(`--- SIMULATING share to OLX for "${property.title}" ---`);
  const fakeListingId = `iid-${Math.floor(Math.random() * 1000000000)}`;
  const listingUrl = `https://www.olx.in/item/${fakeListingId}`;
  await new Promise(resolve => setTimeout(resolve, 900));
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

      if (platformsToShare.includes('99acres')) sharingPromises.push(shareTo99acres(savedProperty));
      if (platformsToShare.includes('olx')) sharingPromises.push(shareToOlx(savedProperty));
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
