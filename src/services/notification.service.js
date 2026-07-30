const supabaseAdmin = require("../config/supabaseAdmin");

/**
 * Create a notification
 */
const createNotification = async ({
  user_id,
  title,
  message,
  type = "general",
}) => {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id,
      title,
      message,
      type,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get notifications for a user
 */
const getUserNotifications = async (
  userId,
  filters = {}
) => {
  const { is_read } = filters;

  let query = supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  // Filter unread/read notifications
  if (is_read !== undefined) {
    query = query.eq(
      "is_read",
      is_read === "true"
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get a single notification
 */
const getNotificationById = async (
  notificationId,
  userId
) => {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("id", notificationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Notification not found");
  }

  return data;
};

/**
 * Mark a notification as read
 */
const markNotificationAsRead = async (
  notificationId,
  userId
) => {
  const notification =
    await getNotificationById(
      notificationId,
      userId
    );

  if (notification.is_read) {
    return notification;
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Mark all notifications as read
 */
const markAllNotificationsAsRead = async (
  userId
) => {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("user_id", userId)
    .eq("is_read", false)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

module.exports = {
  createNotification,
  getUserNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};