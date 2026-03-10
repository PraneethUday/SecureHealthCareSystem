import { supabase } from "./supabase";
import { Notification, NotificationType, UserRole } from "./database.types";

export interface CreateNotificationParams {
  recipientId: string;
  recipientRole: UserRole;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a single notification
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_id: params.recipientId,
      recipient_role: params.recipientRole,
      title: params.title,
      message: params.message,
      type: params.type,
      related_entity_type: params.relatedEntityType,
      related_entity_id: params.relatedEntityId,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return null;
  }

  return data;
}

/**
 * Create notifications for multiple recipients
 */
export async function createBulkNotifications(
  notifications: CreateNotificationParams[],
): Promise<boolean> {
  const records = notifications.map((n) => ({
    recipient_id: n.recipientId,
    recipient_role: n.recipientRole,
    title: n.title,
    message: n.message,
    type: n.type,
    related_entity_type: n.relatedEntityType,
    related_entity_id: n.relatedEntityId,
    metadata: n.metadata || {},
  }));

  const { error } = await supabase.from("notifications").insert(records);

  if (error) {
    console.error("Error creating bulk notifications:", error);
    return false;
  }

  return true;
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  recipientId: string,
  recipientRole: UserRole,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
  },
): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", recipientId)
    .eq("recipient_role", recipientRole)
    .order("created_at", { ascending: false });

  if (options?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(
  recipientId: string,
  recipientRole: UserRole,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("recipient_role", recipientRole)
    .eq("is_read", false);

  if (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  recipientId: string,
  recipientRole: UserRole,
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", recipientId)
    .eq("recipient_role", recipientRole)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }

  return true;
}

/**
 * Delete old read notifications (cleanup)
 */
export async function cleanupOldNotifications(
  daysOld: number = 30,
): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("is_read", true)
    .lt("created_at", cutoffDate.toISOString());

  if (error) {
    console.error("Error cleaning up old notifications:", error);
  }
}

// Notification Templates

export function createAppointmentBookedNotifications(
  appointmentId: string,
  patientId: string,
  patientName: string,
  doctorId: string,
  doctorName: string,
  appointmentDate: string,
  appointmentTime: string,
): CreateNotificationParams[] {
  const notifications: CreateNotificationParams[] = [];

  // Notification for patient
  notifications.push({
    recipientId: patientId,
    recipientRole: "patient",
    title: "Appointment Confirmed",
    message: `Your appointment with Dr. ${doctorName} is confirmed for ${appointmentDate} at ${appointmentTime}.`,
    type: "appointment_booked",
    relatedEntityType: "appointment",
    relatedEntityId: appointmentId,
    metadata: { doctorId, doctorName },
  });

  // Notification for doctor
  notifications.push({
    recipientId: doctorId,
    recipientRole: "doctor",
    title: "New Appointment",
    message: `New appointment booked with ${patientName} for ${appointmentDate} at ${appointmentTime}.`,
    type: "appointment_booked",
    relatedEntityType: "appointment",
    relatedEntityId: appointmentId,
    metadata: { patientId, patientName },
  });

  return notifications;
}

export function createAppointmentCancelledNotifications(
  appointmentId: string,
  patientId: string,
  patientName: string,
  doctorId: string,
  doctorName: string,
  appointmentDate: string,
  cancelledBy: "patient" | "doctor",
): CreateNotificationParams[] {
  const notifications: CreateNotificationParams[] = [];

  if (cancelledBy === "patient") {
    // Notify doctor
    notifications.push({
      recipientId: doctorId,
      recipientRole: "doctor",
      title: "Appointment Cancelled",
      message: `${patientName} has cancelled the appointment scheduled for ${appointmentDate}.`,
      type: "appointment_cancelled",
      relatedEntityType: "appointment",
      relatedEntityId: appointmentId,
    });
  } else {
    // Notify patient
    notifications.push({
      recipientId: patientId,
      recipientRole: "patient",
      title: "Appointment Cancelled",
      message: `Your appointment with Dr. ${doctorName} on ${appointmentDate} has been cancelled.`,
      type: "appointment_cancelled",
      relatedEntityType: "appointment",
      relatedEntityId: appointmentId,
    });
  }

  return notifications;
}

export function createAccessRevokedNotification(
  doctorId: string,
  patientName: string,
): CreateNotificationParams {
  return {
    recipientId: doctorId,
    recipientRole: "doctor",
    title: "Access Revoked",
    message: `${patientName} has revoked your access to their medical records.`,
    type: "access_revoked",
  };
}
