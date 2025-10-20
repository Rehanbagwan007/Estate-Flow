'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { propertySchema } from '@/schemas';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Property } from '@/lib/types';

export async function saveProperty(
  prevState: { message: string },
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    return { message: 'Authentication required.' };
  }

  const validatedFields = propertySchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data. ' + validatedFields.error.flatten().fieldErrors,
    };
  }

 // const { data: propertyData, ...rest } = validatedFields.data;
  const files = formData.getAll('files') as File[];
  const propertyId = formData.get('id') as string | null;

  let savedProperty: Property | null = null;

  try {
    if (propertyId) {
      // Update existing property
      const { data, error } = await (await supabase)
        .from('properties')
        .update({ ...validatedFields.data, updated_at: new Date().toISOString() })
        .eq('id', propertyId)
        .select()
        .single();
      if (error) throw error;
      savedProperty = data;
    } else {
      // Create new property
      const { data, error } = await (await supabase)
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
        const filePath = `${user.id}/${savedProperty.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await (await supabase)?.storage
          .from('property_media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload Error:', uploadError.message);
          continue; // Or handle more gracefully
        }
        
        const { data: urlData } = (await supabase)?.storage
          .from('property_media')
          .getPublicUrl(filePath);

        await (await supabase).from('property_media').insert({
          property_id: savedProperty.id,
          file_path: urlData.publicUrl,
          file_type: file.type,
        });
      }
    }
  } catch (error) {
    console.error(error)
    let message = 'An unknown error occurred';
    if (error instanceof Error) {
      message = error.message;
    }
    return { message: `Database Error: ${message}` };
  }

  revalidatePath('/properties');
  revalidatePath('/');
  redirect('/properties');
}
