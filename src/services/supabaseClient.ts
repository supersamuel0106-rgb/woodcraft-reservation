/**
 * Supabase 客戶端連線服務
 */
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://svksjbgkjnkonvntpbha.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_6AavmvJ1L-BFXXisShqFvA_ikn_mnSY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
