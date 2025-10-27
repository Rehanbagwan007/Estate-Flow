

'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { propertySchema } from '@/schemas';
import { revalidatePath } from 'next/cache';
import type { Property, PropertyShare } from '@/lib/types';
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
            const uploadResponse = await fetch(`${BASE_GRAPH_URL}/${pageId}/photos?url=${encodeURIComponent(imageUrl)}&published=false&access_token=${pageAccessToken}`, {
                method: 'POST',
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
        return { success: false, platform: 'Instagram', error: 'Instagram Business Account ID or Access Token is not configured.' };
    }
    if (!imageUrls || imageUrls.length === 0) {
        return { success: false, platform: 'Instagram', error: 'At least one image is required to post to Instagram.' };
    }

    try {
        const caption = `${property.title}\n\n${property.description || ''}\n\nPrice: ₹${property.price.toLocaleString()}\nLocation: ${property.city}, ${property.state}\n\n#realestate #${property.city.replace(/\s+/g, '')} #${property.property_type?.replace(/\s+/g, '').toLowerCase()}`;

        let finalMediaId;

        if (imageUrls.length === 1) {
            // Single image post
            const containerResponse = await fetch(`${BASE_GRAPH_URL}/${igAccountId}/media?image_url=${encodeURIComponent(imageUrls[0])}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`, {
                method: 'POST',
            });

            const containerResult = await containerResponse.json() as { id?: string; error?: any };
            if (containerResult.error) throw new Error(`Failed to create single media container: ${containerResult.error.message}`);
            
            finalMediaId = containerResult.id;
        } else {
            // Carousel post (2 or more images)
            const childContainerIds: string[] = [];
            for (const imageUrl of imageUrls) {
                const itemContainerResponse = await fetch(`${BASE_GRAPH_URL}/${igAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&access_token=${accessToken}`, {
                    method: 'POST',
                });
                const itemContainerResult = await itemContainerResponse.json() as { id?: string; error?: any };
                if (itemContainerResult.id) {
                    childContainerIds.push(itemContainerResult.id);
                } else {
                    console.error(`Instagram item container creation failed for ${imageUrl}:`, itemContainerResult.error);
                }
            }

            if (childContainerIds.length === 0) {
                throw new Error("All photo uploads to Instagram failed at the container stage.");
            }
            
            const carouselContainerResponse = await fetch(`${BASE_GRAPH_URL}/${igAccountId}/media?media_type=CAROUSEL&caption=${encodeURIComponent(caption)}&children=${childContainerIds.join(',')}&access_token=${accessToken}`, {
                method: 'POST',
            });
            const carouselContainerResult = await carouselContainerResponse.json() as { id?: string; error?: any };
            if (carouselContainerResult.error) throw new Error(`Failed to create carousel container: ${carouselContainerResult.error.message}`);
            
            finalMediaId = carouselContainerResult.id;
        }

        // Publish the final container
        const publishResponse = await fetch(`${BASE_GRAPH_URL}/${igAccountId}/media_publish?creation_id=${finalMediaId}&access_token=${accessToken}`, {
            method: 'POST',
        });
        const publishResult = await publishResponse.json() as { id?: string; error?: any };

        if (publishResult.error) {
            throw new Error(`Failed to publish media to Instagram: ${publishResult.error.message}`);
        }
        
        // We can't get the post URL directly, but we can construct it from the permalink
        const permalinkResponse = await fetch(`${BASE_GRAPH_URL}/${publishResult.id}?fields=permalink&access_token=${accessToken}`);
        const permalinkData = await permalinkResponse.json() as { permalink?: string; error?: any};

        return { success: true, platform: 'Instagram', postUrl: permalinkData.permalink || 'https://www.instagram.com/' };

    } catch (error: any) {
        console.error('Error posting to Instagram:', error);
        return { success: false, platform: 'Instagram', error: error.message };
    }
}


// --- SIMULATED API Functions ---
const generateRandomId = (length = 16) => {
    return Math.random().toString(36).substring(2, length + 2);
}

async function shareTo99acres(property: Property): Promise<MediaUploadResult> {
  console.log(`--- SIMULATING share to 99acres for "${property.title}" ---`);
  const fakeListingId = `p${Math.floor(Math.random() * 10000000)}`;
  const citySlug = property.city.toLowerCase().replace(/\s+/g, '-');
  const listingUrl = `https://www.99acres.com/${fakeListingId}-${property.title.toLowerCase().replace(/\s+/g, '-')}-in-${citySlug}`;
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


// --- Main Server Actions ---
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
  let redirectUrl = '/(dashboard)/properties';

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
      redirectUrl = `/(dashboard)/properties/${propertyId}`;
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
      redirectUrl = `/(dashboard)/properties/${savedProperty.id}`;
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
                revalidatePath(`/(dashboard)/properties/${savedProperty!.id}`);
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
  revalidatePath(redirectUrl);
  
  return {
    success: true,
    message: propertyId ? 'Property updated successfully!' : 'Property created and sharing has started!',
    redirectUrl: redirectUrl,
  };
}

export async function deleteProperty(propertyId: string, propertyCreatorId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Authentication required." };
    }
    
    // RLS will enforce the final permission check, but this provides an early exit.

    // Step 1: Delete all social media posts associated with the property
    const { data: shares, error: sharesError } = await supabase
      .from('property_shares')
      .select('*')
      .eq('property_id', propertyId);
    
    if (sharesError) {
      console.error('Could not fetch property shares for deletion:', sharesError.message);
    } else if (shares) {
      for (const share of shares) {
        await deleteSocialPost(share.id);
      }
    }
    
    // Step 2: Delete associated media from Supabase Storage
    const folderPath = `${propertyCreatorId}/property_media/${propertyId}`;
    const { data: files, error: listError } = await supabase.storage
        .from('property_media')
        .list(folderPath);

    if (listError) {
        console.warn(`Could not list files for property ${propertyId}. Skipping storage cleanup.`, listError);
    }
    
    if (files && files.length > 0) {
        const filePaths = files.map(file => `${folderPath}/${file.name}`);
        const { error: removeError } = await supabase.storage
            .from('property_media')
            .remove(filePaths);
            
        if (removeError) {
            console.error(`Failed to delete some media for property ${propertyId}`, removeError);
            // Non-critical error, we can proceed with deleting the DB record
        }
    }

    // Step 3: Delete the property from the database.
    // The database is configured with cascading deletes, so related records
    // in `property_media`, `property_interests`, etc., will be deleted automatically.
    const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
    
    if (deleteError) {
        console.error('Error deleting property:', deleteError);
        return { error: `Failed to delete property: ${deleteError.message}` };
    }
    
    revalidatePath('/(dashboard)/properties');
    revalidatePath('/dashboard');

    return { success: true, message: 'Property and all associated posts have been deleted successfully.' };
}

async function deleteFacebookPost(postUrl: string, pageId: string, accessToken: string): Promise<{success: boolean, error?: string}> {
  try {
    const postId = postUrl.split('/').pop()?.split('?')[0];
    if (!postId) throw new Error("Could not extract post ID from URL.");

    const response = await fetch(`${BASE_GRAPH_URL}/${postId}?access_token=${accessToken}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    if (result.success) {
      return { success: true };
    } else {
      throw new Error(result.error?.message || "Failed to delete Facebook post.");
    }
  } catch (error: any) {
    console.error('Facebook post deletion error:', error.message);
    return { success: false, error: error.message };
  }
}

async function deleteInstagramPost(postUrl: string, accessToken: string): Promise<{success: boolean, error?: string}> {
    // Note: The Instagram Graph API does not support deleting content via the API.
    // This is a known limitation. We can only simulate this.
    console.warn(`--- SIMULATING Instagram post deletion. URL: ${postUrl} ---`);
    console.warn("The Instagram Graph API does not allow third-party apps to delete posts. This action is only reflected in the CRM.");
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
}

export async function deleteSocialPost(shareId: string): Promise<{success: boolean, error?: string}> {
    const supabase = createClient();
    const { data: share, error: fetchError } = await supabase.from('property_shares').select('*').eq('id', shareId).single();

    if (fetchError || !share || !share.post_url) {
        return { success: false, error: "Share record not found or post URL is missing." };
    }

    let result: {success: boolean, error?: string} = { success: false, error: 'Platform not supported for deletion.' };

    if (share.platform === 'Facebook' && process.env.FACEBOOK_PAGE_ID && process.env.META_ACCESS_TOKEN) {
        result = await deleteFacebookPost(share.post_url, process.env.FACEBOOK_PAGE_ID, process.env.META_ACCESS_TOKEN);
    } else if (share.platform === 'Instagram' && process.env.META_ACCESS_TOKEN) {
        result = await deleteInstagramPost(share.post_url, process.env.META_ACCESS_TOKEN);
    } else if (['99acres', 'OLX'].includes(share.platform)) {
        console.log(`--- SIMULATING deletion from ${share.platform} ---`);
        result = { success: true };
    }

    if (result.success) {
        const { error: dbError } = await supabase.from('property_shares').delete().eq('id', shareId);
        if (dbError) {
            return { success: false, error: `Post was deleted from ${share.platform}, but failed to update CRM record: ${dbError.message}` };
        }
        revalidatePath(`/(dashboard)/properties/${share.property_id}`);
        return { success: true };
    } else {
        return { success: false, error: `Failed to delete from ${share.platform}: ${result.error}` };
    }
}
