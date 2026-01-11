import { supabase } from './supabase';

interface LogActionParams {
  userId: string;
  userRole: 'admin' | 'patient' | 'doctor' | 'nurse' | 'staff';
  action: string;
  details?: string;
  ipAddress?: string;
  status?: 'success' | 'failure';
}

export async function logAction(params: LogActionParams): Promise<void> {
  try {
    const { userId, userRole, action, details, ipAddress, status } = params;

    await supabase.from('access_logs').insert({
      user_id: userId,
      user_role: userRole,
      action,
      details: details || null,
      ip_address: ipAddress || 'unknown',
      status: status || 'success',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log action:', error);
    // Don't throw error - logging failure shouldn't break the main flow
  }
}

export async function getAllLogs(limit: number = 100) {
  try {
    const { data, error } = await supabase
      .from('access_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return [];
  }
}

export async function getLogsByUser(userId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('access_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch user logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch user logs:', error);
    return [];
  }
}

export async function getLogsByRole(userRole: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('access_logs')
      .select('*')
      .eq('user_role', userRole)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch role logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch role logs:', error);
    return [];
  }
}
